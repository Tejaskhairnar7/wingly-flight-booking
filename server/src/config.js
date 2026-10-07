import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 5050,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flight_booking",
  duffel: {
    // duffel_test_... (sandbox) or duffel_live_... (production)
    token: process.env.DUFFEL_ACCESS_TOKEN || "",
    baseUrl: process.env.DUFFEL_BASE_URL || "https://api.duffel.com",
  },
};

export const hasDuffelKey = Boolean(config.duffel.token);
