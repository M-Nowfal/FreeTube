import { verifyToken } from "@/lib/jwt";
import { compare } from "@/lib/password";
import { Playlist } from "@/models/playlist.model";
import { User } from "@/models/user.model";
import { WatchLater } from "@/models/watch-later.model";
import { connectDataBase } from "@/utils/connect-db";
import { TOKEN_NAME } from "@/utils/constants";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDataBase();

    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;

    if (!token)
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );

    const decoded = verifyToken(token);

    if (!decoded?.id)
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );

    const id = decoded?.id;

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(id);
    await Playlist.deleteMany({ username: user.username });
    await WatchLater.deleteMany({ username: user.username });

    cookieStore.set({
      name: TOKEN_NAME,
      value: "",
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(0),
    });

    return NextResponse.json(
      { message: "Account permanently deleted" },
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