import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { Playlist } from "@/models/playlist.model";
import axios from "axios";
import { YOUTUBE_API_KEY } from "@/utils/constants";

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    const { username, channelId, channelTitle, timeframe } = body;

    if (!username || !channelId || !channelTitle || !timeframe) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const now = new Date();
    const publishedAfter = new Date();

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

    let totalAdded = 0;

    const ytRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        channelId: channelId,
        type: "video",
        order: "date",
        maxResults: 50,
        publishedAfter: publishedAfter.toISOString(),
        key: YOUTUBE_API_KEY,
      },
    });

    const items = ytRes.data.items;

    if (items && items.length > 0) {
      let playlist = await Playlist.findOne({ username, channelTitle });
      
      if (!playlist) {
        playlist = new Playlist({ username, channelTitle, videos: [] });
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
            watched: false
          });
          totalAdded++;
        }
      }

      await playlist.save();
    }

    return NextResponse.json({ message: `Sync complete. Added ${totalAdded} new videos.` }, { status: 200 });
  } catch (error: unknown) {
    console.error("Single channel sync error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}