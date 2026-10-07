// Popular destinations + their photos, taken from each place's Wikipedia lead image (real, freely licensed).
// Fetched on the server and cached for a day; if a lookup fails the card falls back to its gradient.
export const DESTINATIONS = [
  { code: "DXB", city: "Dubai", country: "United Arab Emirates", wiki: "Dubai", from: "from-amber-500", to: "to-rose-600" },
  { code: "SIN", city: "Singapore", country: "Singapore", wiki: "Marina_Bay_Sands", from: "from-teal-500", to: "to-sky-700" },
  { code: "LHR", city: "London", country: "United Kingdom", wiki: "London", from: "from-indigo-500", to: "to-slate-800" },
  { code: "BKK", city: "Bangkok", country: "Thailand", wiki: "Bangkok", from: "from-emerald-500", to: "to-cyan-700" },
  { code: "GOI", city: "Goa", country: "India", wiki: "Goa", from: "from-orange-400", to: "to-pink-600" },
  { code: "JFK", city: "New York", country: "United States", wiki: "New_York_City", from: "from-blue-500", to: "to-violet-800" },
];

const THUMB_WIDTH = 960; // Wikimedia only serves fixed thumbnail sizes (330, 960, ...)

async function leadImage(title) {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { "User-Agent": "Wingly/1.0 (flight booking demo)" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const thumb = j.thumbnail?.source;
    if (!thumb || !j.originalimage) return null;
    if (j.originalimage.width < THUMB_WIDTH) return j.originalimage.source;
    return thumb.replace(/\/\d+px-/, `/${THUMB_WIDTH}px-`).replace(/\?.*$/, "");
  } catch {
    return null;
  }
}

export async function getDestinations() {
  const images = await Promise.all(DESTINATIONS.map((d) => leadImage(d.wiki)));
  return DESTINATIONS.map((d, i) => ({ ...d, image: images[i] }));
}
