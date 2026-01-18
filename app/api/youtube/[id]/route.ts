import { YOUTUBE_API_KEY } from "@/utils/constants";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { id } = await params;
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics",
          id,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    if (!response.data.items.length) {
      return NextResponse.json(
        { message: "Video not found" },
        { status: 404 }
      );
    }

    const video = response.data.items[0];
    const { snippet, statistics } = video;

    const video_details = {
      title: snippet.title,
      description: snippet.description,
      thumbnails: snippet.thumbnails,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,

      views: Number(statistics.viewCount),
      likes: Number(statistics.likeCount),
      commentsCount: Number(statistics.commentCount),
    };

    return NextResponse.json(
      { id, video_details },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      {
        message: "Internal Server error",
        error: err instanceof Error ? err.message : "An unknown error occurred"
      },
      { status: 500 }
    );
  }
}