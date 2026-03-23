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

    return NextResponse.json({ 
      playlist: {
        ...playlist.toObject(),
        updatedAt: playlist.updatedAt?.toISOString()
      }
    }, { status: 200 });
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
    const { action, videoId } = await req.json(); // Extract videoId instead of videoTitle

    if (action === "MARK_WATCHED") {
      // Find the specific playlist and the exact video inside the array, then set watched to true
      const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: id, "videos.videoId": videoId },
        { $set: { "videos.$.watched": true } },
        { new: true }
      );

      if (!updatedPlaylist) return NextResponse.json({ message: "Not found" }, { status: 404 });
      return NextResponse.json({ playlist: updatedPlaylist }, { status: 200 });
    }

    if (action === "REMOVE_VIDEO") {
      // Pull the video out of the array using its ID
      const updatedPlaylist = await Playlist.findByIdAndUpdate(
        id,
        { $pull: { videos: { videoId: videoId } } },
        { new: true }
      );

      if (!updatedPlaylist) return NextResponse.json({ message: "Not found" }, { status: 404 });
      return NextResponse.json({ playlist: updatedPlaylist }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({
      message: "Server Error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}