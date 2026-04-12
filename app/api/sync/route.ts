import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { User } from "@/models/user.model";
import { Playlist } from "@/models/playlist.model";
import axios from "axios";
import { YOUTUBE_API_KEY } from "@/utils/constants";

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

    for (const sub of user.subscriptions) {
      try {
        let publishedAfter: Date | null = null;

        if (timeframe === "last") {
          const playlist = await Playlist.findOne({ username, channelTitle: sub.title });
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

        let playlist = await Playlist.findOne({ username, channelTitle: sub.title });

        if (!playlist) {
          playlist = new Playlist({ username, channelTitle: sub.title, videos: [] });
        }

        for (const item of items) {
          const videoId = item.id.videoId;

          const exists = playlist.videos.some((v: any) => v.videoId === videoId);

          if (!exists) {
            playlist.videos.push({
              videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt,
            });
            totalAdded++;
          }
        }

        await playlist.save();
      } catch (err) {
        console.error(`Error syncing channel ${sub.channelId}:`, err);
      }
    }

    return NextResponse.json({ message: `Sync complete. Added ${totalAdded} new videos.` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
