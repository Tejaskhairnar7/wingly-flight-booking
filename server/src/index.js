import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { config, hasDuffelKey } from "./config.js";
import { flightsRouter } from "./routes/flights.js";
import { bookingsRouter } from "./routes/bookings.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: "100kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1,
    duffelConfigured: hasDuffelKey,
    duffelMode: config.duffel.token.startsWith("duffel_live") ? "live" : "test",
  }),
);
app.use("/api", flightsRouter);
app.use("/api/bookings", bookingsRouter);
app.use(notFound);
app.use(errorHandler);

try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB connected");
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`API on http://localhost:${config.port}`);
  if (!hasDuffelKey) console.warn("⚠ DUFFEL_ACCESS_TOKEN missing in server/.env — flight search will return an error until added.");
});
