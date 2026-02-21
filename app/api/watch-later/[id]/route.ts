import { NextRequest, NextResponse } from "next/server";
import { WatchLater } from "@/models/watch-later.model";
import { connectDataBase } from "@/utils/connect-db";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDataBase();
    const { id } = await params;
    
    const video = await WatchLater.findByIdAndUpdate(id, { watched: true }, { new: true });
    return NextResponse.json({ video }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDataBase();
    const { id } = await params;
    
    await WatchLater.findByIdAndDelete(id);
    return NextResponse.json({ message: "Video removed" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}