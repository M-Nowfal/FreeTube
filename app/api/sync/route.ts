import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { User } from "@/models/user.model";
import { Playlist } from "@/models/playlist.model";
import { Short } from "@/models/short.model";
import axios from "axios";
import { YOUTUBE_API_KEY } from "@/utils/constants";
import { parseDuration, isYouTubeShort } from "@/utils/helper";

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const { username, timeframe } = await req.json();

    if (!username || !timeframe) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findOne({ username });
    if (!user || !user.subscriptions || user.subscriptions.length === 0) {
      return NextResponse.json({ message: "No subscriptions found" }, { status: 404 });
    }

    let totalAdded = 0;
    let shortsAdded = 0;
    const MAX_SHORTS = 100;

    for (const sub of user.subscriptions) {
      try {
        let publishedAfter: Date | null = null;

        if (timeframe === "last") {
          const playlist = await Playlist.findOne({ username, channelTitle: sub.title, isCustom: { $ne: true } });
          if (playlist && playlist.videos.length > 0) {
            const sortedVideos = [...playlist.videos].sort((a, b) => {
              const dateA = new Date(a.publishedAt || 0).getTime();
              const dateB = new Date(b.publishedAt || 0).getTime();
              return dateB - dateA;
            });
            const latestVideo = sortedVideos[0];
            if (latestVideo?.publishedAt) {
              const latestDate = new Date(latestVideo.publishedAt);
              latestDate.setSeconds(latestDate.getSeconds() + 1);
              publishedAfter = latestDate;
            }
          }
        }

        if (!publishedAfter) {
          const now = new Date();
          publishedAfter = new Date();

          switch (timeframe) {
            case "1h":
              publishedAfter.setHours(now.getHours() - 1);
              break;
            case "1d":
              publishedAfter.setDate(now.getDate() - 1);
              break;
            case "1w":
              publishedAfter.setDate(now.getDate() - 7);
              break;
            case "1m":
              publishedAfter.setMonth(now.getMonth() - 1);
              break;
            case "1y":
              publishedAfter.setFullYear(now.getFullYear() - 1);
              break;
            default:
              publishedAfter.setDate(now.getDate() - 1);
          }
        }

        const searchParams: any = {
          part: "snippet",
          channelId: sub.channelId,
          type: "video",
          order: "date",
          maxResults: 50,
          key: YOUTUBE_API_KEY,
        };

        if (publishedAfter) {
          searchParams.publishedAfter = publishedAfter.toISOString();
        }

        const ytRes = await axios.get("https://www.googleapis.com/youtube/v3/search", { params: searchParams });

        const items = ytRes.data.items;
        if (!items || items.length === 0) continue;

        const videoIds = items.map((item: { id: { videoId: string } }) => item.id.videoId);

        const detailsMap: Record<string, { duration: number; views: number; likes: number; channelThumbnail: string }> = {};
        
        try {
          const detailsRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
              part: "contentDetails,snippet,statistics",
              id: videoIds.join(","),
              key: YOUTUBE_API_KEY,
            },
          });

          for (const item of detailsRes.data.items) {
            detailsMap[item.id] = {
              duration: parseDuration(item.contentDetails?.duration || ""),
              views: parseInt(item.statistics?.viewCount || "0", 10),
              likes: parseInt(item.statistics?.likeCount || "0", 10),
              channelThumbnail: item.snippet?.thumbnails?.default?.url || "",
            };
          }
        } catch (detailsError) {
          console.error("Error fetching video details:", detailsError);
        }

        let playlist = await Playlist.findOne({ username, channelTitle: sub.title });

        if (!playlist) {
          playlist = new Playlist({ username, channelTitle: sub.title, videos: [] });
        }

        for (const item of items) {
          const videoId = item.id.videoId;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const details = detailsMap[videoId] || { duration: 0, views: 0, likes: 0, channelThumbnail: "" };
          const isShort = isYouTubeShort(videoUrl, details.duration);

          if (isShort && shortsAdded < MAX_SHORTS) {
            const existingShort = await Short.findOne({ username, videoId });
            
            if (!existingShort) {
              await Short.findOneAndUpdate(
                { username, videoId },
                {
                  $setOnInsert: {
                    username,
                    channelId: sub.channelId,
                    channelTitle: item.snippet.channelTitle,
                    channelThumbnail: details.channelThumbnail,
                    videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
                    publishedAt: item.snippet.publishedAt,
                    duration: details.duration,
                    views: details.views,
                    likes: details.likes,
                  }
                },
                { upsert: true }
              );
              shortsAdded++;
            }
          } else {
            const exists = playlist.videos.some((v: { videoId: string }) => v.videoId === videoId);

            if (!exists) {
              playlist.videos.push({
                videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                duration: details.duration,
              });
              totalAdded++;
            }
          }
        }

        await playlist.save();
      } catch (err) {
        console.error(`Error syncing channel ${sub.channelId}:`, err);
      }
    }

    return NextResponse.json({ 
      message: `Sync complete. Added ${totalAdded} new videos and ${shortsAdded} shorts.` 
    }, { status: 200 });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
