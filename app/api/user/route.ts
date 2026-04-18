import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { Short } from "@/models/short.model";
import { Playlist } from "@/models/playlist.model";
import { WatchLater } from "@/models/watch-later.model";

export async function DELETE(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const action = searchParams.get("action");

    if (!username) {
      return NextResponse.json({ message: "Username required" }, { status: 400 });
    }

    let result;

    if (action === "all-videos") {
      result = await Playlist.deleteMany({ username });
      return NextResponse.json({ message: `${result.deletedCount} playlists (videos) deleted` }, { status: 200 });
    }

    if (action === "all-shorts") {
      result = await Short.deleteMany({ username });
      return NextResponse.json({ message: `${result.deletedCount} shorts deleted` }, { status: 200 });
    }

    if (action === "watched-videos") {
      const playlists = await Playlist.find({ username });
      let totalDeleted = 0;
      
      for (const playlist of playlists) {
        const watchedVideos = playlist.videos?.filter((v: any) => v.watched) || [];
        playlist.videos = playlist.videos?.filter((v: any) => !v.watched) || [];
        if (watchedVideos.length > 0) {
          await playlist.save();
          totalDeleted += watchedVideos.length;
        }
      }

      const shorts = await Short.deleteMany({ username, watched: true });
      const watchLater = await WatchLater.deleteMany({ username, watched: true });

      return NextResponse.json({ 
        message: `${totalDeleted} videos, ${shorts.deletedCount} shorts, ${watchLater.deletedCount} watch later items deleted` 
      }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action. Use: all-videos, all-shorts, or watched-videos" }, { status: 400 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}