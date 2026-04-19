import { YOUTUBE_API_KEY } from "@/utils/constants";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

interface VideoStatData {
  description: string;
  views: number;
  likes: number;
  commentsCount: number;
}

interface YouTubeItem {
  id: string;
  snippet: { description: string };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

const statsCache = new Map<string, { stats: Record<string, VideoStatData>; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    if (!ids) return NextResponse.json({ message: "No IDs provided" }, { status: 400 });

    // Check cache first
    const cached = statsCache.get(ids);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ stats: cached.stats }, { status: 200 });
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics",
          id: ids,
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

    // Cache the results
    statsCache.set(ids, { stats: videoStats, timestamp: Date.now() });

    return NextResponse.json({ stats: videoStats }, { status: 200 });
  } catch (error: unknown) {
    console.error("YouTube API Error:", error);
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      return NextResponse.json({ message: "YouTube API quota exceeded. Please try again later.", stats: {} }, { status: 403 });
    }
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}