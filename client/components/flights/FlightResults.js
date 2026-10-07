"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, PlaneTakeoff, SlidersHorizontal, SearchX, Pencil } from "lucide-react";
import SearchForm from "@/components/search/SearchForm";
import FlightCard from "./FlightCard";
import FareStrip from "./FareStrip";
import Filters, { TIME_BUCKETS, defaultFilters } from "./Filters";
import Button from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { searchFlights } from "@/lib/api";
import { CLASS_LABELS, formatDate, formatDuration, formatPrice } from "@/lib/format";
import { cityOf, fromQuery, travellerSummary, validateSearch } from "@/lib/search";

const SORTS = [
  { id: "price", label: "Cheapest" },
  { id: "duration", label: "Fastest" },
  { id: "departure", label: "Earliest" },
];

const totalMinutes = (f) => f.itineraries.reduce((s, it) => s + it.durationMinutes, 0);
const maxStops = (f) => Math.max(...f.itineraries.map((it) => it.stops));
const departHour = (f) => Number(f.itineraries[0].segments[0].departAt.slice(11, 13));

function priceBounds(flights) {
  const prices = flights.map((f) => f.price.total);
  const max = Math.max(...prices);
  const step = 10 ** Math.max(0, String(Math.floor(max)).length - 3);
  return { min: Math.floor(Math.min(...prices) / step) * step, max: Math.ceil(max / step) * step };
}

export default function FlightResults() {
  const router = useRouter();
  const sp = useSearchParams();
  const queryString = sp.toString();
  const search = useMemo(() => fromQuery(new URLSearchParams(queryString)), [queryString]);
  const problems = useMemo(() => validateSearch(search), [search]);
  const invalid = Object.keys(problems).length > 0;

  const [attempt, setAttempt] = useState(0);
  // `loaded` belongs to one search; if the URL changes it is stale and we show loading again.
  const requestKey = `${queryString}#${attempt}`;
  const [loaded, setLoaded] = useState({ key: null });
  const state = loaded.key === requestKey ? loaded : { status: "loading", flights: [], error: null };
  const [filters, setFilters] = useState(null);
  const [sort, setSort] = useState("price");
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (invalid) return;
    const controller = new AbortController();
    searchFlights(
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
      .then(({ flights }) => {
        setLoaded({ key: requestKey, status: "success", flights, error: null });
        setFilters(flights.length ? defaultFilters(priceBounds(flights).max) : null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLoaded({ key: requestKey, status: "error", flights: [], error: err.message });
      });
    return () => controller.abort(); // a newer search supersedes this one
  }, [search, invalid, requestKey]);

  const { flights } = state;
  const bounds = useMemo(() => (flights.length ? priceBounds(flights) : null), [flights]);
  const currency = flights[0]?.price.currency || "INR";
  const travellers = search.adults + search.children + search.infants;

  const airlines = useMemo(() => {
    const map = new Map();
    for (const f of flights) {
      const cur = map.get(f.validatingAirline);
      if (!cur || f.price.total < cur) map.set(f.validatingAirline, f.price.total);
    }
    return [...map].map(([name, minPrice]) => ({ name, minPrice })).sort((a, b) => a.minPrice - b.minPrice);
  }, [flights]);

  const visible = useMemo(() => {
    if (!filters) return [];
    const list = flights.filter((f) => {
      if (filters.stops.length && !filters.stops.includes(Math.min(maxStops(f), 2))) return false;
      if (filters.airlines.length && !filters.airlines.includes(f.validatingAirline)) return false;
      if (f.price.total > filters.maxPrice) return false;
      if (filters.times.length) {
        const h = departHour(f);
        if (!TIME_BUCKETS.some((b) => filters.times.includes(b.id) && h >= b.from && h < b.to)) return false;
      }
      return true;
    });
    const by = {
      price: (a, b) => a.price.total - b.price.total,
      duration: (a, b) => totalMinutes(a) - totalMinutes(b),
      departure: (a, b) => a.itineraries[0].segments[0].departAt.localeCompare(b.itineraries[0].segments[0].departAt),
    }[sort];
    return [...list].sort(by);
  }, [flights, filters, sort]);

  const activeCount = filters
    ? filters.stops.length + filters.airlines.length + filters.times.length + (bounds && filters.maxPrice < bounds.max ? 1 : 0)
    : 0;
  const resetFilters = useCallback(() => bounds && setFilters(defaultFilters(bounds.max)), [bounds]);

  const quick = useMemo(() => {
    if (!flights.length) return {};
    return {
      price: formatPrice(Math.min(...flights.map((f) => f.price.total)), currency),
      duration: formatDuration(Math.min(...flights.map(totalMinutes))),
    };
  }, [flights, currency]);

  // Jump to another day from the fare strip, keeping everything else in the URL.
  const pickDate = (departureDate, returnDate) => {
    const next = new URLSearchParams(queryString);
    next.set("departureDate", departureDate);
    if (returnDate) next.set("returnDate", returnDate);
    router.push(`/flights?${next.toString()}`);
  };

  const select = (flight) => {
    try {
      sessionStorage.setItem("wingly:selection", JSON.stringify({ flight, search }));
    } catch {
      /* storage can be blocked; /book shows a recovery message if so */
    }
    router.push("/book");
  };

  if (invalid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={SearchX}
          title="This search link is incomplete"
          description="Some trip details are missing or out of date. Start a new search to continue."
          action={
            <Link href="/#search" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
              New search
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Trip summary */}
      <div className="rounded-card bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex flex-wrap items-center gap-x-2 text-xl font-bold sm:text-2xl">
              {cityOf(search.origin.label)} <ArrowRight className="size-5 text-brand-600" aria-label="to" /> {cityOf(search.destination.label)}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {formatDate(search.departureDate)}
              {search.tripType === "ROUND_TRIP" && ` – ${formatDate(search.returnDate)}`} · {travellerSummary(search)} · {CLASS_LABELS[search.travelClass]}
              {search.nonStop && " · Non-stop only"}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
            <Pencil className="size-4" aria-hidden="true" />
            {editing ? "Close" : "Modify search"}
          </Button>
        </div>
        {editing && (
          <div className="mt-5 border-t border-line pt-5">
            <SearchForm key={queryString} defaultValues={search} onSubmitted={() => setEditing(false)} />
          </div>
        )}
      </div>

      {state.status === "success" && flights.length > 0 && (
        <div className="mt-4">
          <FareStrip search={search} currency={currency} currentPrice={Math.min(...flights.map((f) => f.price.total))} onPick={pickDate} />
        </div>
      )}

      <div className="mt-2 grid gap-6 lg:grid-cols-[17rem_1fr]">
        {/* Filters */}
        <aside aria-label="Filters" className={`${showFilters ? "block" : "hidden"} h-fit rounded-card bg-white p-4 shadow-card lg:sticky lg:top-24 lg:block`}>
          {filters && bounds ? (
            <Filters
              filters={filters}
              onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
              bounds={bounds}
              airlines={airlines}
              currency={currency}
              activeCount={activeCount}
              onReset={resetFilters}
            />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </aside>

        {/* Results */}
        <section aria-label="Flight results" className="min-w-0">
          {state.status === "success" && flights.length > 0 && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Sort flights by">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={sort === s.id}
                    onClick={() => setSort(s.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      sort === s.id ? "border-brand-600 bg-brand-50" : "border-line bg-white hover:bg-brand-50/60"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="block truncate text-xs text-ink-soft">{s.id === "price" ? `from ${quick.price}` : s.id === "duration" ? quick.duration : "by departure"}</span>
                  </button>
                ))}
              </div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-ink-soft" role="status" aria-live="polite">
                  <strong className="text-ink">{visible.length}</strong> of {flights.length} flights
                </p>
                <Button variant="secondary" size="sm" className="lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Filters{activeCount > 0 && ` (${activeCount})`}
                </Button>
              </div>
            </>
          )}

          {state.status === "loading" && (
            <div className="space-y-4" role="status" aria-label="Loading flights">
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <PlaneTakeoff className="size-4 animate-pulse text-brand-600" aria-hidden="true" />
                Searching airlines for the best fares…
              </p>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-card" />
              ))}
            </div>
          )}

          {state.status === "error" && (
            <ErrorState title="We couldn't load flights" message={state.error} onRetry={() => setAttempt((n) => n + 1)} />
          )}

          {state.status === "success" && flights.length === 0 && (
            <EmptyState
              title="No flights found for this trip"
              description="Try different dates or a nearby airport. Flexible dates often have more options."
              action={<Button onClick={() => setEditing(true)}>Change search</Button>}
            />
          )}

          {state.status === "success" && flights.length > 0 && visible.length === 0 && (
            <EmptyState
              title="No flights match your filters"
              description="Loosen a filter to see more options."
              action={<Button onClick={resetFilters}>Clear all filters</Button>}
            />
          )}

          <ul className="space-y-4">
            {visible.map((f, i) => (
              <li key={f.id} className="anim-fade-up" style={{ "--d": `${Math.min(i, 8) * 55}ms` }}>
                <FlightCard flight={f} travellers={travellers} onSelect={select} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
