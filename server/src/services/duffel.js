import { config, hasDuffelKey } from "../config.js";
import { HttpError } from "../lib/errors.js";

async function duffel(path, { method = "GET", params, body } = {}) {
  if (!hasDuffelKey) {
    throw new HttpError(503, "Live flight data isn't connected. Add DUFFEL_ACCESS_TOKEN to server/.env and restart the API.");
  }
  const url = new URL(config.duffel.baseUrl + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.duffel.token}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(40_000),
  });
  if (res.status === 401) throw new HttpError(502, "Duffel rejected the access token. Check DUFFEL_ACCESS_TOKEN in server/.env.");
  if (res.status === 429) throw new HttpError(429, "Too many requests to the flight provider. Please wait a moment.");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.errors?.[0]?.message || json?.errors?.[0]?.title || "Flight provider error";
    throw new HttpError(res.status >= 500 ? 502 : 400, detail);
  }
  return json;
}

const toLocations = (json) =>
  (json.data || [])
    .filter((p) => p.iata_code)
    .slice(0, 8)
    .map((p) => ({
      iataCode: p.iata_code,
      name: p.name,
      type: p.type === "city" ? "CITY" : "AIRPORT",
      cityName: p.city_name || p.city?.name || p.name,
      countryName: p.iata_country_code || p.city?.iata_country_code || "",
    }));

export async function searchLocations(keyword) {
  return toLocations(await duffel("/places/suggestions", { params: { query: keyword } }));
}

export async function locationsNear(lat, lng, radiusMeters = 150_000) {
  return toLocations(await duffel("/places/suggestions", { params: { lat, lng, rad: radiusMeters } }));
}

const CABINS = { ECONOMY: "economy", PREMIUM_ECONOMY: "premium_economy", BUSINESS: "business", FIRST: "first" };

export async function searchFlights(q, { max = 50 } = {}) {
  const slices = [{ origin: q.origin, destination: q.destination, departure_date: q.departureDate }];
  if (q.returnDate) slices.push({ origin: q.destination, destination: q.origin, departure_date: q.returnDate });

  const passengers = [
    ...Array.from({ length: q.adults }, () => ({ type: "adult" })),
    ...Array.from({ length: q.children || 0 }, () => ({ type: "child" })),
    ...Array.from({ length: q.infants || 0 }, () => ({ type: "infant_without_seat" })),
  ];

  const json = await duffel("/air/offer_requests", {
    method: "POST",
    params: { return_offers: "true", supplier_timeout: 15000 },
    body: {
      data: {
        slices,
        passengers,
        cabin_class: CABINS[q.travelClass],
        max_connections: q.nonStop ? 0 : undefined,
      },
    },
  });
  const offers = (json.data?.offers || [])
    .sort((a, b) => Number(a.total_amount) - Number(b.total_amount))
    .slice(0, max);
  return normalizeOffers(offers);
}

function isoDurationToMinutes(iso = "") {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso);
  return m ? Number(m[1] || 0) * 1440 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

// Turn Duffel offers into the compact shape the UI needs.
export function normalizeOffers(offers) {
  return offers.map((offer) => {
    const firstSeg = offer.slices?.[0]?.segments?.[0];
    const paxSeg = firstSeg?.passengers?.[0];
    const checked = (paxSeg?.baggages || []).find((b) => b.type === "checked");
    return {
      id: offer.id,
      price: { total: Number(offer.total_amount), currency: offer.total_currency },
      seatsLeft: null, // Duffel doesn't expose remaining seats
      cabin: paxSeg?.cabin_class ? paxSeg.cabin_class.toUpperCase() : null,
      checkedBags: checked ? checked.quantity : 0,
      validatingAirline: offer.owner?.name || "",
      itineraries: offer.slices.map((slice) => ({
        durationMinutes: isoDurationToMinutes(slice.duration),
        stops: slice.segments.length - 1,
        segments: slice.segments.map((s) => {
          const carrier = s.marketing_carrier || s.operating_carrier || {};
          return {
            from: s.origin.iata_code,
            to: s.destination.iata_code,
            departAt: s.departing_at,
            arriveAt: s.arriving_at,
            terminalFrom: s.origin_terminal || null,
            terminalTo: s.destination_terminal || null,
            carrierCode: carrier.iata_code,
            carrierName: carrier.name || carrier.iata_code,
            flightNumber: `${carrier.iata_code}${s.marketing_carrier_flight_number}`,
            aircraft: s.aircraft?.name || null,
            durationMinutes: isoDurationToMinutes(s.duration),
          };
        }),
      })),
    };
  });
}

export { hasDuffelKey };
