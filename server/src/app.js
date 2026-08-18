import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import appointmentRoutes from "./routes/appointments.js";
import managementRoutes from "./routes/management.js";
import { errorHandler, notFound } from "./middleware/index.js";
import { isDatabaseConnected } from "./config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5180", credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "NovaCare API is healthy",
      data: { database: isDatabaseConnected() ? "mongodb" : "demo", timestamp: new Date().toISOString() },
    });
  });

  app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-8" }), authRoutes);
  app.use("/api", catalogRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api", managementRoutes);

  if (process.env.NODE_ENV === "production") {
    const clientDist = path.resolve(__dirname, "../../client/dist");
    app.use(express.static(clientDist));
    app.get("/{*splat}", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  } else {
    app.use(notFound);
  }

  app.use(errorHandler);
  return app;
}
