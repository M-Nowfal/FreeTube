import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { Playlist } from "@/models/playlist.model";

export async function GET(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const playlists = await Playlist.find({
      username,
      isCustom: { $ne: true },
    }).sort({ createdAt: -1 });

    const unwatchedVideos = playlists
      .flatMap((p) => p.videos || [])
      .filter((v) => !v.watched)
      .filter((v) => !v.duration || v.duration >= 60)
      .sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 200);

    return NextResponse.json({ videos: unwatchedVideos }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching unwatched videos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
