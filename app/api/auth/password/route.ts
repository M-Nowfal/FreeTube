import { verifyToken } from "@/lib/jwt";
import { compare, hash } from "@/lib/password";
import { User } from "@/models/user.model";
import { connectDataBase } from "@/utils/connect-db";
import { TOKEN_NAME } from "@/utils/constants";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
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

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "User does not have a password set" },
        { status: 400 }
      );
    }

    const isPasswordValid = await compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const hashedPassword = await hash(newPassword);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { message: "Password changed successfully" },
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
