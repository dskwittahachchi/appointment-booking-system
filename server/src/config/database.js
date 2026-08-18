import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || process.env.DEMO_MODE === "true") {
    console.info("[database] Running with the in-memory demo store");
    return false;
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.info(`[database] Connected to ${mongoose.connection.name}`);
  return true;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
