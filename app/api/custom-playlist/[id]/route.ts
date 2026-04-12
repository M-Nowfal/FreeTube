import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { CustomPlaylist } from "@/models/custom-playlist.model";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDataBase();
    const { id } = await params;

    const playlist = await CustomPlaylist.findById(id);

    if (!playlist) {
      return NextResponse.json({ message: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({
      playlist: {
        ...playlist.toObject(),
        _id: playlist._id.toString(),
        updatedAt: playlist.updatedAt?.toISOString()
      }
    }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDataBase();
    const { id } = await params;
    const body = await req.json();
    const { action, videoId } = body;

    if (!action) {
      return NextResponse.json({ message: "Action required" }, { status: 400 });
    }

    const playlist = await CustomPlaylist.findById(id);

    if (!playlist) {
      return NextResponse.json({ message: "Playlist not found" }, { status: 404 });
    }

    if (action === "remove_video") {
      if (!videoId) {
        return NextResponse.json({ message: "Video ID required" }, { status: 400 });
      }
      playlist.videos = playlist.videos.filter((v: { videoId: string }) => v.videoId !== videoId);
      await playlist.save();
      return NextResponse.json({
        message: "Video removed",
        playlist: {
          ...playlist.toObject(),
          _id: playlist._id.toString(),
          updatedAt: playlist.updatedAt?.toISOString()
        }
      }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDataBase();
    const { id } = await params;

    const playlist = await CustomPlaylist.findByIdAndDelete(id);

    if (!playlist) {
      return NextResponse.json({ message: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Playlist deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
