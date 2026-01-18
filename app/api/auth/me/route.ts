import { verifyToken } from "@/lib/jwt";
import { User } from "@/models/user.model";
import { connectDataBase } from "@/utils/connect-db";
import { TOKEN_NAME } from "@/utils/constants";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
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

    const user = await User.findById(decoded.id);

    if (!user) {
      const cookieStore = await cookies();

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
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Authorized", user },
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