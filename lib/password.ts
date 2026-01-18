import { SALT_ROUNDS } from "@/utils/constants";
import bcryptjs from "bcryptjs";

export async function hash(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcryptjs.hash(password, salt);

  return hashedPassword;
}

export async function compare(password: string, hash: string): Promise<boolean> {
  return await bcryptjs.compare(password, hash);
}