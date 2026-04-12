import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { User } from "@/models/user.model";
import { Playlist } from "@/models/playlist.model";
import { Short } from "@/models/short.model";

// Fetch user's subscriptions
export async function GET(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscriptions = user.subscriptions || [];

    const playlists = await Playlist.find({ username });
    const shorts = await Short.find({ username });

    const playlistMap = new Map<string, { totalVideos: number; watchedVideos: number }>();

    for (const playlist of playlists) {
      const totalVideos = playlist.videos?.length || 0;
      const watchedVideos = playlist.videos?.filter((v: any) => v.watched).length || 0;
      playlistMap.set(playlist.channelTitle.toLowerCase(), { totalVideos, watchedVideos });
    }

    // Add shorts counts per channelId
    const shortCountsByChannelId = new Map<string, { totalShorts: number; watchedShorts: number }>();
    for (const short of shorts) {
      const current = shortCountsByChannelId.get(short.channelId) || { totalShorts: 0, watchedShorts: 0 };
      shortCountsByChannelId.set(short.channelId, {
        totalShorts: current.totalShorts + 1,
        watchedShorts: current.watchedShorts + (short.watched ? 1 : 0),
      });
    }

    const subscriptionsWithCounts = subscriptions.map((sub: any) => {
      const channelTitleLower = sub.title.toLowerCase();
      const playlistCounts = playlistMap.get(channelTitleLower) || { totalVideos: 0, watchedVideos: 0 };
      const shortCounts = shortCountsByChannelId.get(sub.channelId) || { totalShorts: 0, watchedShorts: 0 };
      return {
        ...sub.toObject ? sub.toObject() : sub,
        totalVideos: playlistCounts.totalVideos + shortCounts.totalShorts,
        watchedVideos: playlistCounts.watchedVideos + shortCounts.watchedShorts,
      };
    });

    const sortedPlaylists = await Playlist.find({ username }).sort({ updatedAt: -1 });
    
    const lastSynced = sortedPlaylists.length > 0 && sortedPlaylists[0].updatedAt
      ? sortedPlaylists[0].updatedAt.toISOString()
      : null;

    return NextResponse.json({
      subscriptions: subscriptionsWithCounts,
      lastSynced
    }, { status: 200 });
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Subscribe to a channel
export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    const { channelId, title, thumbnail, username } = body;

    if (!channelId || !title || !thumbnail || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAlreadySubscribed = user.subscriptions.some(
      (sub: any) => sub.channelId === channelId
    );

    if (isAlreadySubscribed) {
      return NextResponse.json(
        { message: "Already subscribed to this channel" },
        { status: 409 }
      );
    }

    user.subscriptions.push({ channelId, title, thumbnail });
    await user.save();

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Unsubscribe from a channel
export async function DELETE(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const channelId = searchParams.get("channelId");

    if (!username || !channelId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    await User.findOneAndUpdate(
      { username },
      { $pull: { subscriptions: { channelId } } },
      { new: true }
    );

    return NextResponse.json({ message: "Unsubscribed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}