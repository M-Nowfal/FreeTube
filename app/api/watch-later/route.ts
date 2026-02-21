import { NextRequest, NextResponse } from "next/server";
import { WatchLater } from "@/models/watch-later.model";
import { connectDataBase } from "@/utils/connect-db";

export async function GET(req: NextRequest) {
  try {
    await connectDataBase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) return NextResponse.json({ message: "Username required" }, { status: 400 });

    const videos = await WatchLater.find({ username }).sort({ createdAt: -1 });
    return NextResponse.json({ videos }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDataBase();
    const body = await req.json();
    
    const existing = await WatchLater.findOne({ username: body.username, videoId: body.videoId });
    if (existing) {
      return NextResponse.json({ message: "Video already in Watch Later" }, { status: 400 });
    }

    const newVideo = await WatchLater.create(body);
    return NextResponse.json({ message: "Added to Watch Later", video: newVideo }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}