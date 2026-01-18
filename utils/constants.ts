const API_URL = process.env.NEXT_PUBLIC_API_URL;

const DB_URI = process.env.DB_URI!;
const DB_NAME = process.env.DB_NAME!;

const TOKEN_NAME = process.env.TOKEN_NAME!;
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN!, 10);
const NODE_ENV = process.env.NODE_ENV!;

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS!, 10);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

export {
  API_URL, DB_NAME, DB_URI,
  TOKEN_NAME, JWT_SECRET,
  JWT_EXPIRES_IN, NODE_ENV,
  SALT_ROUNDS, YOUTUBE_API_KEY
};