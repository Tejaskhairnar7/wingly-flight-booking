"use client";

import { useId, useState } from "react";
import { ChevronDown, Luggage, Plane } from "lucide-react";
import Button from "@/components/ui/Button";
import { dayOffset, formatDate, formatDuration, formatPrice, formatTime, stopsLabel } from "@/lib/format";

export function ItinerarySummary({ itinerary, label }) {
  const first = itinerary.segments[0];
  const last = itinerary.segments[itinerary.segments.length - 1];
  const plusDays = dayOffset(first.departAt, last.arriveAt);
  const via = itinerary.segments.slice(0, -1).map((s) => s.to);
  const carriers = [...new Set(itinerary.segments.map((s) => s.carrierName))].join(" + ");

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5">
      <div className="min-w-[4.5rem] text-left">
        <p className="text-xl font-bold tabular-nums sm:text-2xl">{formatTime(first.departAt)}</p>
        <p className="text-sm font-semibold text-ink-soft">{first.from}</p>
      </div>

      <div className="min-w-0 text-center">
        <p className="truncate text-xs text-ink-faint">
          {label && <span className="mr-1.5 font-semibold text-ink-soft">{label} ·</span>}
          {formatDate(first.departAt)}
        </p>
        <div className="relative my-1.5 flex items-center" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          <Plane className="mx-1.5 size-4 rotate-90 text-brand-600" />
          <span className="h-px flex-1 bg-line" />
        </div>
        <p className="text-xs font-medium text-ink-soft">
          {formatDuration(itinerary.durationMinutes)} ·{" "}
          <span className={itinerary.stops === 0 ? "text-success" : ""}>{stopsLabel(itinerary.stops)}</span>
          {via.length > 0 && <span className="text-ink-faint"> via {via.join(", ")}</span>}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-faint">{carriers}</p>
      </div>

      <div className="min-w-[4.5rem] text-right">
        <p className="text-xl font-bold tabular-nums sm:text-2xl">
          {formatTime(last.arriveAt)}
          {plusDays > 0 && (
            <sup className="ml-0.5 text-[10px] font-semibold text-warning" title={`Arrives ${plusDays} day later`}>
              +{plusDays}
            </sup>
          )}
        </p>
        <p className="text-sm font-semibold text-ink-soft">{last.to}</p>
      </div>
    </div>
  );
}

function SegmentList({ itinerary }) {
  return (
    <ol className="space-y-3">
      {itinerary.segments.map((s, i) => (
        <li key={`${s.flightNumber}-${i}`} className="rounded-xl bg-canvas p-3 text-sm">
          <p className="font-semibold">
            {s.carrierName} {s.flightNumber}
            <span className="font-normal text-ink-soft"> · {s.aircraft || "Aircraft TBC"}</span>
          </p>
          <p className="mt-1 text-ink-soft">
            {formatTime(s.departAt)} {s.from}
            {s.terminalFrom && ` (T${s.terminalFrom})`} → {formatTime(s.arriveAt)} {s.to}
            {s.terminalTo && ` (T${s.terminalTo})`} · {formatDuration(s.durationMinutes)}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function FlightCard({ flight, travellers, onSelect }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const [outbound, inbound] = flight.itineraries;
  const perPerson = travellers > 1 ? flight.price.total / travellers : null;

  return (
    <article className="rounded-card bg-white shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:gap-8">
        <div className="space-y-5">
          <ItinerarySummary itinerary={outbound} label={inbound ? "Outbound" : undefined} />
          {inbound && (
            <>
              <hr className="border-line" />
              <ItinerarySummary itinerary={inbound} label="Return" />
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line pt-4 md:min-w-44 md:flex-col md:items-end md:justify-center md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div className="md:text-right">
            <p className="text-2xl font-bold tabular-nums">{formatPrice(flight.price.total, flight.price.currency)}</p>
            <p className="text-xs text-ink-faint">
              {travellers > 1 ? `total · ${formatPrice(Math.round(perPerson), flight.price.currency)} avg / person` : "per person"}
            </p>
            {flight.seatsLeft && flight.seatsLeft <= 5 && (
              <p className="mt-1 text-xs font-semibold text-warning">Only {flight.seatsLeft} seats left at this price</p>
            )}
          </div>
          <Button onClick={() => onSelect(flight)} aria-label={`Select flight for ${formatPrice(flight.price.total, flight.price.currency)}`}>
            Select
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-soft sm:px-5">
        <span className="flex items-center gap-1.5">
          <Luggage className="size-3.5" aria-hidden="true" />
          {flight.checkedBags === null ? "Baggage rules vary" : flight.checkedBags > 0 ? `${flight.checkedBags} checked bag included` : "Cabin bag only"}
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold text-brand-700 hover:bg-brand-50"
        >
          Flight details
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div id={detailsId} className="space-y-4 border-t border-line p-4 sm:p-5">
          <div>
            {inbound && <h3 className="mb-2 text-sm font-semibold">Outbound</h3>}
            <SegmentList itinerary={outbound} />
          </div>
          {inbound && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Return</h3>
              <SegmentList itinerary={inbound} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
