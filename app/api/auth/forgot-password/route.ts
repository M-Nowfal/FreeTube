import { connectDataBase } from "@/utils/connect-db";
import { User } from "@/models/user.model";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from "@/utils/constants";

const RESET_TOKEN_EXPIRY = 60 * 60 * 1000;

async function sendResetEmail(email: string, resetUrl: string, username: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST || "smtp.gmail.com",
      port: parseInt(SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `FreeTube <${SMTP_USER}>`,
      to: email,
      subject: "FreeTube Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">FreeTube Password Reset</h2>
          <p>Hello ${username},</p>
          <p>You requested a password reset for your FreeTube account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDataBase();

    const body = await req.json();
    const { username, email } = body;

    if (!username || !email) {
      return NextResponse.json(
        { error: "Username and email are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username, email });

    if (!user) {
      return NextResponse.json(
        { message: "If an account matches these credentials, a reset link has been sent to your email." },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    const emailSent = await sendResetEmail(email, resetUrl, username);

    if (!emailSent) {
      throw new Error("Email not sent");
    }

    return NextResponse.json(
      { message: "If an account matches these credentials, a reset link has been sent to your email." },
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
