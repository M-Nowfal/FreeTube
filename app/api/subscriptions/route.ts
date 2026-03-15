import { NextRequest, NextResponse } from "next/server";
import { connectDataBase } from "@/utils/connect-db";
import { User } from "@/models/user.model";

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

    return NextResponse.json(user.subscriptions || [], { status: 200 });
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