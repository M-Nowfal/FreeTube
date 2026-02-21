import { YOUTUBE_API_KEY } from "@/utils/constants";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

interface VideoStatData {
  description: string;
  views: number;
  likes: number;
  commentsCount: number;
}

// 2. Define the shape of the YouTube API response item
interface YouTubeItem {
  id: string;
  snippet: { description: string };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids"); // e.g., "id1,id2,id3"

    if (!ids) return NextResponse.json({ message: "No IDs provided" }, { status: 400 });

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics",
          id: ids, // Pass the comma-separated string here!
          key: YOUTUBE_API_KEY,
        },
      }
    );

    // Create a map for easy lookup on the frontend
    const videoStats: Record<string, VideoStatData> = {};
    response.data.items.forEach((item: YouTubeItem) => {
      videoStats[item.id] = {
        description: item.snippet.description,
        views: Number(item.statistics.viewCount),
        likes: Number(item.statistics.likeCount),
        commentsCount: Number(item.statistics.commentCount),
      };
    });

    return NextResponse.json({ stats: videoStats }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}