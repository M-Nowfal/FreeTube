import { generateToken } from "@/lib/jwt";
import { compare } from "@/lib/password";
import { User } from "@/models/user.model";
import { connectDataBase } from "@/utils/connect-db";
import { cookieOptions } from "@/utils/options";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDataBase();

    const { username, email, password } = await req.json();

    const user = await User.findOne({ username, email });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Incorrect Password" },
        { status: 401 }
      );
    }

    const token = generateToken({ id: user._id });

    (await cookies()).set(cookieOptions(token));

    return NextResponse.json(
      { message: `Welcome back ${user.username}` },
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