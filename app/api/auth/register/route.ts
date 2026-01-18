import { generateToken } from "@/lib/jwt";
import { hash } from "@/lib/password";
import { User } from "@/models/user.model";
import { connectDataBase } from "@/utils/connect-db";
import { cookieOptions } from "@/utils/options";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDataBase();

    const { username, email, password, confirmPassword } = await req.json();

    if (confirmPassword !== password) {
      return NextResponse.json(
        { message: "Password do not match" },
        { status: 400 }
      );
    }

    const isExistingUser = await User.findOne({ username, email });

    if (isExistingUser) {
      return NextResponse.json(
        { message: "User already exist, login or use different email and username" },
        { status: 401 }
      );
    }

    const hashedPassword = await hash(password);

    const user = await User.create({
      username, email, password: hashedPassword
    });

    const token = generateToken({ id: user._id });

    (await cookies()).set(cookieOptions(token));

    return NextResponse.json(
      { message: "User registered successfully!" },
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