import { Router } from "express";
import { z } from "zod";
import { parse } from "../middleware/error.js";
import { flightSearchSchema } from "../lib/schemas.js";
import { searchFlights, searchLocations, locationsNear } from "../services/duffel.js";

export const flightsRouter = Router();

// Small TTL cache: protects the Duffel rate limits from repeated identical calls.
// Failures are never cached.
const cache = new Map();
const inflight = new Map();
async function cached(key, ttlMs, loader) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  if (inflight.has(key)) return inflight.get(key);
  const p = loader()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + ttlMs });
      if (cache.size > 500) cache.delete(cache.keys().next().value);
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

const locationQuery = z.object({ keyword: z.string().trim().min(2, "Type at least 2 letters").max(28) });

flightsRouter.get("/locations", async (req, res) => {
  const { keyword } = parse(locationQuery, req.query);
  const locations = await cached(`loc:${keyword.toLowerCase()}`, 10 * 60_000, () => searchLocations(keyword));
  res.json({ locations });
});

flightsRouter.get("/flights", async (req, res) => {
  const q = parse(flightSearchSchema, req.query);
  const flights = await cached(`fl:${JSON.stringify(q)}`, 5 * 60_000, () => searchFlights(q));
  res.json({ flights, query: q });
});

const isLoopback = (ip = "") => ip === "::1" || ip.startsWith("127.") || ip === "::ffff:127.0.0.1";

// Default "From" airport: IP -> city (ipwho.is) -> Duffel airport. Returns { location: null } when unknown;
// never invents a city.
flightsRouter.get("/locations/nearby", async (req, res) => {
  // Behind localhost the browser's IP is unknowable here, so ask the geo service to use the caller's public IP.
  const ip = isLoopback(req.ip) ? "" : req.ip.replace(/^::ffff:/, "");
  const location = await cached(`geo:${ip || "self"}`, 60 * 60_000, async () => {
    try {
      const geo = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(5000) }).then((r) => r.json());
      if (!geo?.success) return null;
      const byCity = geo.city ? await searchLocations(geo.city) : [];
      const hit =
        byCity.find((l) => l.countryName === geo.country_code && l.cityName.toLowerCase() === geo.city.toLowerCase()) ||
        (await locationsNear(geo.latitude, geo.longitude)).find((l) => l.type === "AIRPORT") ||
        null;
      return hit;
    } catch {
      return null;
    }
  });
  res.json({ location });
});

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

// Cheapest fare for the days around the chosen date (the "fare strip" above results).
// Uses the same offer search so prices are in the same currency as the results.
flightsRouter.get("/flights/calendar", async (req, res) => {
  const q = parse(flightSearchSchema, req.query);
  const offsets = [-3, -2, -1, 1, 2, 3];

  const days = await Promise.all(
    offsets.map(async (offset) => {
      const departureDate = addDays(q.departureDate, offset);
      if (departureDate < todayIso()) return null;
      const dayQuery = { ...q, departureDate, returnDate: q.returnDate ? addDays(q.returnDate, offset) : undefined };
      try {
        const offers = await cached(`cal:${JSON.stringify(dayQuery)}`, 10 * 60_000, () => searchFlights(dayQuery, { max: 5 }));
        const cheapest = offers.reduce((min, o) => (min === null || o.price.total < min.price.total ? o : min), null);
        return {
          departureDate,
          returnDate: dayQuery.returnDate ?? null,
          price: cheapest ? cheapest.price.total : null,
          currency: cheapest ? cheapest.price.currency : q.currency,
        };
      } catch {
        return { departureDate, returnDate: dayQuery.returnDate ?? null, price: null, currency: q.currency };
      }
    }),
  );
  res.json({ days: days.filter(Boolean) });
});
