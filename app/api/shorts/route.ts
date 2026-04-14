import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { Short } from "@/models/short.model";
import { Playlist } from "@/models/playlist.model";

export async function GET(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!username) {
      return NextResponse.json({ message: "Username required" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const [shorts, totalCount] = await Promise.all([
      Short.find({ username })
        .sort({ publishedAt: 1 })
        .skip(skip)
        .limit(limit),
      Short.countDocuments({ username })
    ]);

    const shortsWithStrings = shorts.map(s => ({
      ...s.toObject(),
      _id: s._id.toString(),
      updatedAt: s.updatedAt?.toISOString()
    }));

    const hasMore = skip + shorts.length < totalCount;

    return NextResponse.json({
      shorts: shortsWithStrings,
      page,
      limit,
      total: totalCount,
      hasMore
    }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    const { action, username, shortId, videoId } = body;

    if (!action || !username) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (action === "like" && shortId) {
      const short = await Short.findOne({ _id: shortId, username });
      if (!short) {
        return NextResponse.json({ message: "Short not found" }, { status: 404 });
      }

      short.liked = !short.liked;
      short.likes = short.liked 
        ? (short.likes || 0) + 1 
        : Math.max((short.likes || 0) - 1, 0);
      
      await short.save();

      return NextResponse.json({
        message: short.liked ? "Liked" : "Unliked",
        liked: short.liked,
        likes: short.likes
      }, { status: 200 });
    }

    if (action === "watched" && shortId) {
      const short = await Short.findOne({ _id: shortId, username });
      if (!short) {
        return NextResponse.json({ message: "Short not found" }, { status: 404 });
      }

      short.watched = true;
      await short.save();

      return NextResponse.json({ message: "Marked as watched" }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const shortId = searchParams.get("shortId");
    const videoId = searchParams.get("videoId");
    const channelId = searchParams.get("channelId");
    const channelTitle = searchParams.get("channelTitle");

    // Delete single short by ID
    if (shortId) {
      await Short.findOneAndDelete({ _id: shortId, username });
      return NextResponse.json({ message: "Short deleted" }, { status: 200 });
    }

    // Delete all shorts for a channel
    if (channelId && username) {
      const result = await Short.deleteMany({ username, channelId });
      return NextResponse.json({ message: `${result.deletedCount} shorts deleted` }, { status: 200 });
    }

    // Delete video from playlist
    if (videoId && channelTitle && username) {
      const playlist = await Playlist.findOne({ username, channelTitle });
      if (playlist) {
        playlist.videos = playlist.videos.filter((v: any) => v.videoId !== videoId);
        await playlist.save();
        return NextResponse.json({ message: "Video deleted from playlist" }, { status: 200 });
      }
    }

    // Delete all videos for a channel from playlist
    if (channelTitle && username) {
      await Playlist.deleteMany({ username, channelTitle });
      return NextResponse.json({ message: "All videos deleted from playlist" }, { status: 200 });
    }

    // Delete all shorts for a user (global delete)
    if (username && !shortId && !channelId && !videoId && !channelTitle) {
      const result = await Short.deleteMany({ username });
      return NextResponse.json({ message: `${result.deletedCount} shorts deleted` }, { status: 200 });
    }

    return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
