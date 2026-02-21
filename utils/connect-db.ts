import mongoose from "mongoose";
import { DB_NAME, DB_URI } from "./constants";

let isConnected = false;

export async function connectDataBase(): Promise<void> {
  if (isConnected) return;
  await mongoose.connect(DB_URI, { dbName: DB_NAME });
  isConnected = true;
  console.log("DataBase connected successfully!");
}
