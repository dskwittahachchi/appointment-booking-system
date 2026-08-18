import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { initializeRepository } from "./services/repository.js";

const port = Number(process.env.PORT) || 5050;

async function start() {
  try {
    await connectDatabase();
    await initializeRepository();
    createApp().listen(port, () => {
      console.info(`[server] NovaCare API ready at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("[server] Unable to start", error);
    process.exitCode = 1;
  }
}

start();
