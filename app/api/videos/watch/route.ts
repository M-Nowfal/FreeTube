import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { Playlist } from "@/models/playlist.model";

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    
    const { username, videoId } = body;

    if (!username || !videoId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await Playlist.updateOne(
      { username: username, "videos.videoId": videoId },
      { $set: { "videos.$.watched": true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Video not found in your playlists" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error marking video as watched:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}