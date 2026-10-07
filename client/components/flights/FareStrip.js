"use client";

import { useEffect, useMemo, useState } from "react";
import { searchFareCalendar } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const dayParts = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const f = (o) => new Intl.DateTimeFormat("en-IN", { ...o, timeZone: "UTC" }).format(date);
  return { weekday: f({ weekday: "short" }), date: f({ day: "numeric", month: "short" }) };
};

/**
 * Cheapest fare for the 3 days either side of the chosen date (real Duffel offers),
 * like the fare strip on airline sites. Silent if the calendar can't be loaded.
 */
export default function FareStrip({ search, currentPrice, currency, onPick }) {
  const key = `${search.origin.iataCode}-${search.destination.iataCode}-${search.departureDate}-${search.returnDate}-${search.adults}-${search.children}-${search.infants}-${search.travelClass}-${search.nonStop}`;
  const [loaded, setLoaded] = useState({ key: null, days: [] });

  useEffect(() => {
    const controller = new AbortController();
    searchFareCalendar(
      {
        origin: search.origin.iataCode,
        destination: search.destination.iataCode,
        departureDate: search.departureDate,
        returnDate: search.tripType === "ROUND_TRIP" ? search.returnDate : undefined,
        adults: search.adults,
        children: search.children,
        infants: search.infants,
        travelClass: search.travelClass,
        nonStop: search.nonStop ? "true" : undefined,
      },
      controller.signal,
    )
      .then(({ days }) => setLoaded({ key, days }))
      .catch((err) => err.name !== "AbortError" && setLoaded({ key, days: [] }));
    return () => controller.abort();
    // `key` captures every search field that matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const ready = loaded.key === key;
  const cells = useMemo(() => {
    if (!ready) return [];
    const current = { departureDate: search.departureDate, returnDate: search.returnDate || null, price: currentPrice, current: true };
    return [...loaded.days, current].sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  }, [ready, loaded.days, search.departureDate, search.returnDate, currentPrice]);

  if (ready && loaded.days.every((d) => d.price === null)) return null; // nothing useful to show

  const cheapest = cells.reduce((min, c) => (c.price !== null && (min === null || c.price < min) ? c.price : min), null);

  return (
    <nav aria-label="Fares for nearby dates" className="mb-4 overflow-x-auto rounded-card bg-white p-2 shadow-card">
      <ul className="grid min-w-[34rem] grid-cols-7 gap-1">
        {!ready &&
          Array.from({ length: 7 }, (_, i) => (
            <li key={i} className="skeleton h-[4.25rem]" aria-hidden="true" />
          ))}
        {cells.map((c) => {
          const p = dayParts(c.departureDate);
          const isCheapest = c.price !== null && c.price === cheapest;
          return (
            <li key={c.departureDate}>
              <button
                type="button"
                disabled={c.current || c.price === null}
                aria-current={c.current ? "date" : undefined}
                onClick={() => onPick(c.departureDate, c.returnDate)}
                className={`flex h-[4.25rem] w-full flex-col items-center justify-center rounded-xl border px-1 text-center transition-colors ${
                  c.current ? "border-brand-600 bg-brand-50" : "border-transparent hover:bg-brand-50 disabled:hover:bg-transparent"
                } disabled:cursor-default`}
              >
                <span className="text-xs text-ink-soft">
                  {p.weekday}, {p.date}
                </span>
                <span className={`mt-0.5 text-sm font-bold tabular-nums ${c.price === null ? "text-ink-faint" : isCheapest ? "text-success" : "text-ink"}`}>
                  {c.price === null ? "—" : formatPrice(c.price, currency)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
