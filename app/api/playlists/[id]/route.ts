import { NextRequest, NextResponse } from "next/server";
import { Playlist } from "@/models/playlist.model";
import { connectDataBase } from "@/utils/connect-db";
import { IVideo } from "@/types/playlist";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDataBase();
    const { id } = await params;

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return NextResponse.json({ message: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ playlist }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDataBase();
    const { id } = await params;

    await Playlist.findByIdAndDelete(id);

    return NextResponse.json({ message: "Playlist deleted" }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDataBase();
    const { id } = await params;
    const { action, videoTitle } = await req.json();

    const playlist = await Playlist.findById(id);
    if (!playlist) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (action === "REMOVE_VIDEO") {
      playlist.videos = playlist.videos.filter((v: IVideo) => v.title !== videoTitle);
    }
    else if (action === "MARK_WATCHED") {
      const video = playlist.videos.find((v: IVideo) => v.title === videoTitle);
      if (video) video.watched = true;
    }

    // Mongoose needs to know the mixed array was modified
    playlist.markModified('videos');
    await playlist.save();

    return NextResponse.json({ playlist }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}