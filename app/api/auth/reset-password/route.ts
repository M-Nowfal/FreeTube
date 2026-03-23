import { connectDataBase } from "@/utils/connect-db";
import { User } from "@/models/user.model";
import { hash } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDataBase();

    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    }).select("+resetToken +resetTokenExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Password has been reset successfully. You can now login with your new password." },
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
