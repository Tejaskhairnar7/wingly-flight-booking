"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, CheckCircle2, Copy, Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { ItinerarySummary } from "@/components/flights/FlightCard";
import { getBooking } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/passengers";

export default function BookingConfirmation() {
  const { reference } = useParams();
  const [state, setState] = useState({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to loading on retry
    setState({ status: "loading" });
    getBooking(reference, controller.signal)
      .then(({ booking }) => setState({ status: "success", booking }))
      .catch((err) => err.name !== "AbortError" && setState({ status: "error", message: err.message, notFound: err.status === 404 }));
    return () => controller.abort();
  }, [reference, attempt]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked; the code is visible to copy by hand */
    }
  };

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8" role="status" aria-label="Loading booking">
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-56 w-full rounded-card" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          title={state.notFound ? "Booking not found" : "We couldn't load this booking"}
          message={state.message}
          onRetry={state.notFound ? undefined : () => setAttempt((n) => n + 1)}
        />
        <p className="mt-6 text-center text-sm">
          <Link href="/manage" className="font-semibold text-brand-700 hover:underline">
            Look up a different booking
          </Link>
        </p>
      </div>
    );
  }

  const { booking } = state;
  const { flight } = booking;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <p className="mb-3 hidden items-baseline justify-between border-b border-line pb-2 print:flex">
        <span className="text-lg font-bold text-brand-700">Wingly</span>
        <span className="text-xs text-ink-soft">E-ticket · Booking confirmation</span>
      </p>
      <div className="print-avoid-break rounded-card bg-white p-6 text-center shadow-card sm:p-8 print:border print:border-line print:p-4">
        <CheckCircle2 className="mx-auto size-14 text-success print:size-9" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight print:mt-1 print:text-xl">Booking confirmed</h1>
        <p className="mt-1 text-sm text-ink-soft">A confirmation for {booking.contact.email} is on record. Keep your reference handy.</p>
        <div className="mx-auto mt-5 flex max-w-xs print:mt-3 items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3">
          <div className="text-left">
            <p className="text-xs font-medium text-ink-soft">Booking reference</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-brand-900">{booking.reference}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={copy} aria-label="Copy booking reference" className="print:hidden">
            {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <section aria-labelledby="trip-h" className="print-avoid-break mt-5 space-y-5 rounded-card bg-white p-5 shadow-card sm:p-6 print:mt-3 print:space-y-3 print:border print:border-line print:p-4">
        <h2 id="trip-h" className="text-base font-semibold">Your trip</h2>
        <ItinerarySummary itinerary={flight.itineraries[0]} label={flight.itineraries[1] ? "Outbound" : undefined} />
        {flight.itineraries[1] && (
          <>
            <hr className="border-line" />
            <ItinerarySummary itinerary={flight.itineraries[1]} label="Return" />
          </>
        )}
      </section>

      <section aria-labelledby="pax-h" className="print-avoid-break mt-5 rounded-card bg-white p-5 shadow-card sm:p-6 print:mt-3 print:border print:border-line print:p-4">
        <h2 id="pax-h" className="text-base font-semibold">Passengers</h2>
        <ul className="mt-3 divide-y divide-line">
          {booking.passengers.map((p, i) => (
            <li key={i} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium">
                {p.title} {p.firstName} {p.lastName}
              </span>
              <span className="text-ink-soft">{TYPE_LABEL[p.type]}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-1 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-faint">Email</dt>
            <dd className="font-medium">{booking.contact.email}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Phone</dt>
            <dd className="font-medium">{booking.contact.phone}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Total paid (demo)</span>
          <span className="text-2xl font-bold tabular-nums">{formatPrice(booking.totalPrice, booking.currency)}</span>
        </p>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" /> Print
        </Button>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
          Book another flight
        </Link>
      </div>
    </div>
  );
}
