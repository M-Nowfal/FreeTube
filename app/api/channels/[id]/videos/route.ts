import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { Playlist } from "@/models/playlist.model";
import { Short } from "@/models/short.model";
import { User } from "@/models/user.model";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDataBase();
    const { id } = await params; 
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const title = searchParams.get("title");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // 1. Get channel metadata from user's subscriptions
    const user = await User.findOne({ username });
    const subscription = user?.subscriptions.find((sub: any) => sub.channelId === id);
    
    // Fallback to URL title if not found in subs (in case they view an unsubscribed channel)
    const channelTitle = subscription?.title || title;

    if (!channelTitle) {
      return NextResponse.json({ error: "Channel info not found" }, { status: 404 });
    }

    // 2. Fetch the playlist that matches this channel title
    const playlist = await Playlist.findOne({ username, channelTitle });

    // 3. Fetch shorts from this channel
    const shorts = await Short.find({ username, channelId: id }).sort({ publishedAt: -1 });

    // Convert shorts to video format and combine with playlist videos
    const shortVideos = shorts.map((short: any) => ({
      videoId: short.videoId,
      title: short.title,
      thumbnail: short.thumbnail,
      channelTitle: short.channelTitle,
      publishedAt: short.publishedAt,
      duration: short.duration,
      watched: short.watched,
    }));

    // Combine playlist videos with shorts
    const allVideos = [...(playlist?.videos || []), ...shortVideos];

    const playlistUpdatedAt = playlist?.updatedAt ? playlist.updatedAt.toISOString() : null;

    return NextResponse.json({
      channelInfo: subscription || { channelId: id, title: channelTitle },
      videos: allVideos,
      playlistUpdatedAt
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching channel videos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}