import mongoose from "mongoose";
import { env } from "@/config/env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  // Register connection lifecycle listeners for complete visibility
  mongoose.connection.on("error", (err) => {
    process.stderr.write(`Mongoose connection error: ${String(err)}\n`);
  });

  mongoose.connection.on("disconnected", () => {
    process.stdout.write("Mongoose connection disconnected\n");
  });

  mongoose.connection.on("reconnected", () => {
    process.stdout.write("Mongoose connection reestablished successfully\n");
  });

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production"
  });

  process.stdout.write("MongoDB database connected successfully\n");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
