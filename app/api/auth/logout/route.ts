import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TOKEN_NAME } from "@/utils/constants";

export async function POST(): Promise<NextResponse> {
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

  return NextResponse.json({ success: true });
}