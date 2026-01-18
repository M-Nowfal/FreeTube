import { Playlist } from "@/models/playlist.model";
import { connectDataBase } from "@/utils/connect-db";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await connectDataBase();
    const { id } = await params;

    const playlist = await Playlist.findById(id);
    
    return NextResponse.json(
      { 
        message: "Playlist fetched", 
        playlist 
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      {
        message: "Internal Server error",
        error: err instanceof Error ? err.message : "An unknown error occurred"
      },
      { status: 500 }
    );
  }
}