import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { User } from "@/models/user.model";

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