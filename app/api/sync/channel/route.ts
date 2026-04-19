import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { Playlist } from "@/models/playlist.model";
import { Short } from "@/models/short.model";
import axios from "axios";
import { YOUTUBE_API_KEY } from "@/utils/constants";
import { parseDuration, isYouTubeShortAccurate } from "@/utils/helper";

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    const { username, channelId, channelTitle, timeframe } = body;

    if (!username || !channelId || !channelTitle || !timeframe) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    let publishedAfter: Date | null = null;

    if (timeframe === "last") {
      const playlist = await Playlist.findOne({ username, channelTitle });
      if (playlist && playlist.lastSyncedAt) {
        const lastSyncedDate = new Date(playlist.lastSyncedAt);
        lastSyncedDate.setSeconds(lastSyncedDate.getSeconds() + 1);
        publishedAfter = lastSyncedDate;
      } else if (playlist && playlist.videos.length > 0) {
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

    let totalAdded = 0;
    let shortsAdded = 0;

    const searchParams: any = {
      part: "snippet",
      channelId: channelId,
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

    if (items && items.length > 0) {
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

      let playlist = await Playlist.findOne({ username, channelTitle });

      if (!playlist) {
        playlist = new Playlist({ username, channelTitle, videos: [] });
      }

      for (const item of items) {
        const videoId = item.id.videoId;
        const details = detailsMap[videoId] || { duration: 0, views: 0, likes: 0, channelThumbnail: "" };
        const isShort = await isYouTubeShortAccurate(videoId, channelId, details.duration);

        if (isShort) {
          const existingShort = await Short.findOne({ username, videoId });
          
          if (!existingShort) {
            await Short.findOneAndUpdate(
              { username, videoId },
              {
                $setOnInsert: {
                  username,
                  channelId,
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
              watched: false,
              duration: details.duration,
            });
            totalAdded++;
          }
        }
      }

      await playlist.save();

      if (totalAdded > 0 || shortsAdded > 0) {
        const sortedItems = [...items].sort((a, b) => {
          const dateA = new Date(a.snippet.publishedAt || 0).getTime();
          const dateB = new Date(b.snippet.publishedAt || 0).getTime();
          return dateB - dateA;
        });
        const latestItem = sortedItems[0];
        if (latestItem?.snippet?.publishedAt) {
          playlist.lastSyncedAt = new Date(latestItem.snippet.publishedAt);
          await playlist.save();
        }
      }
    }

    return NextResponse.json({ 
      message: `Sync complete. Added ${totalAdded} new videos and ${shortsAdded} shorts.` 
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Single channel sync error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
