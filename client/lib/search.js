import { todayIso } from "./format";

export const MAX_TRAVELLERS = 9;

export function emptySearch() {
  return {
    tripType: "ROUND_TRIP",
    origin: null, // location: { iataCode, cityName, name, label }
    destination: null,
    departureDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: "ECONOMY",
    nonStop: false,
  };
}

export const cityOf = (label = "") => label.replace(/\s*\(.*\)\s*$/, "");

export function makeLocation({ iataCode, cityName, name }) {
  return { iataCode, cityName, name: name || "", label: `${cityName} (${iataCode})` };
}

export function validateSearch(v) {
  const errors = {};
  const today = todayIso();

  if (!v.origin) errors.origin = "Choose a departure airport from the list";
  if (!v.destination) errors.destination = "Choose a destination airport from the list";
  else if (v.origin && v.origin.iataCode === v.destination.iataCode) {
    errors.destination = "Destination must be different from departure";
  }

  if (!v.departureDate) errors.departureDate = "Pick a departure date";
  else if (v.departureDate < today) errors.departureDate = "Departure can't be in the past";

  if (v.tripType === "ROUND_TRIP") {
    if (!v.returnDate) errors.returnDate = "Pick a return date";
    else if (v.departureDate && v.returnDate < v.departureDate) {
      errors.returnDate = "Return must be on or after departure";
    }
  }
  return errors;
}

// Form values -> URL query string for /flights
export function toQuery(v) {
  const p = new URLSearchParams({
    origin: v.origin.iataCode,
    originLabel: v.origin.label,
    originAirport: v.origin.name,
    destination: v.destination.iataCode,
    destinationLabel: v.destination.label,
    destinationAirport: v.destination.name,
    departureDate: v.departureDate,
    adults: String(v.adults),
    children: String(v.children),
    infants: String(v.infants),
    travelClass: v.travelClass,
  });
  if (v.tripType === "ROUND_TRIP" && v.returnDate) p.set("returnDate", v.returnDate);
  if (v.nonStop) p.set("nonStop", "true");
  return p;
}

// URL query -> form values (used to prefill the form and to call the API)
export function fromQuery(sp) {
  const get = (k) => sp.get(k) || "";
  const num = (k, d) => {
    const n = Number(sp.get(k));
    return Number.isInteger(n) && n >= 0 ? n : d;
  };
  const loc = (prefix) =>
    get(prefix)
      ? makeLocation({
          iataCode: get(prefix),
          cityName: cityOf(get(`${prefix}Label`)) || get(prefix),
          name: get(`${prefix}Airport`),
        })
      : null;
  const returnDate = get("returnDate");
  return {
    tripType: returnDate ? "ROUND_TRIP" : "ONE_WAY",
    origin: loc("origin"),
    destination: loc("destination"),
    departureDate: get("departureDate"),
    returnDate,
    adults: Math.max(1, num("adults", 1)),
    children: num("children", 0),
    infants: num("infants", 0),
    travelClass: get("travelClass") || "ECONOMY",
    nonStop: get("nonStop") === "true",
  };
}

export function travellerSummary(v) {
  const total = v.adults + v.children + v.infants;
  return `${total} traveller${total > 1 ? "s" : ""}`;
}
