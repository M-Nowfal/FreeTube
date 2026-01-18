import { NODE_ENV, TOKEN_NAME } from "./constants";

export const cookieOptions = (token: string) => {
  return {
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: (NODE_ENV === "production" ? "none" : "lax") as "none" | "lax" | "strict" | boolean,
    path: "/",
    maxAge: 60 * 60 * 24 * 100,
    expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
  };
}