import { NextRequest, NextResponse } from "next/server";
import { Playlist } from "@/models/playlist.model"; // Adjust this path if necessary
import { connectDataBase } from "@/utils/connect-db";
import { IVideo } from "@/types/playlist";

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    const { username, channelTitle, video } = body;

    if (!username || !channelTitle || !video) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Find if a playlist already exists for this user and channel
    let playlist = await Playlist.findOne({ username, channelTitle });

    if (playlist) {
      const isExistingVideo = playlist.videos?.some((v: IVideo) => v.videoId === video.videoId);
      if (isExistingVideo) {
        return NextResponse.json({ message: "Video already added to the playlist." }, { status: 400 });
      }

      // If it exists, push the new video
      playlist.videos.push(video);
      await playlist.save();
    } else {
      // If not, create a new playlist for this channel
      playlist = await Playlist.create({
        username,
        channelTitle,
        videos: [video],
      });
    }

    return NextResponse.json({ message: "Added to playlist", playlist }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ message: "Username required" }, { status: 400 });
    }

    // Fetch all playlists for the user
    const playlists = await Playlist.find({ username }).sort({ createdAt: -1 });

    return NextResponse.json({ playlists }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}