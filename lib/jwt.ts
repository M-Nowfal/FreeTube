import { JWT_EXPIRES_IN, JWT_SECRET } from "@/utils/constants";
import jwt, { SignOptions } from "jsonwebtoken";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

export interface JwtPayload {
  id: string;
}

export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}