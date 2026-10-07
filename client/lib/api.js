// NEXT_PUBLIC_API_URL is filled from NEXT_PUBLIC_API_URL or NEXT_API_URL in next.config.mjs
const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, fields } = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, { signal, method = "GET", body, params } = {}) {
  const url = new URL(BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Can't reach the server. Check your connection and try again.");
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.error || "Something went wrong. Please try again.", {
      status: res.status,
      fields: json?.fields,
    });
  }
  return json;
}

export const searchLocations = (keyword, signal) => request("/locations", { signal, params: { keyword } });
export const nearbyLocation = (signal) => request("/locations/nearby", { signal });
export const searchFlights = (params, signal) => request("/flights", { signal, params });
export const searchFareCalendar = (params, signal) => request("/flights/calendar", { signal, params });
export const createBooking = (payload) => request("/bookings", { method: "POST", body: payload });
export const getBooking = (reference, signal) => request(`/bookings/${encodeURIComponent(reference)}`, { signal });
