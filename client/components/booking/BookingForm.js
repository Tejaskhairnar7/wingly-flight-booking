"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ShieldCheck, TicketX } from "lucide-react";
import Field, { inputClass } from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import DateField from "@/components/ui/DateField";
import Button from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { ItinerarySummary } from "@/components/flights/FlightCard";
import { createBooking } from "@/lib/api";
import { formatPrice, todayIso } from "@/lib/format";
import { buildPassengers, TYPE_LABEL, validateBooking } from "@/lib/passengers";
import { cityOf } from "@/lib/search";

const STORAGE_KEY = "wingly:selection";

function PassengerFieldset({ index, passenger, onChange, show, touch }) {
  const key = (f) => `passengers.${index}.${f}`;
  const set = (f) => (e) => onChange(index, { [f]: e.target.value });
  const pick = (f) => (v) => onChange(index, { [f]: v });
  const first = index === 0;
  const hintByType = {
    CHILD: "Age 2–11 on the travel date",
    INFANT: "Under 2 on the travel date",
    ADULT: undefined,
  };

  return (
    <fieldset className="rounded-card bg-white p-5 shadow-card sm:p-6">
      <legend className="float-left mb-4 w-full text-base font-semibold">
        Passenger {index + 1} <span className="ml-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{TYPE_LABEL[passenger.type]}</span>
      </legend>
      <div className="clear-both grid gap-4 sm:grid-cols-6">
        <Field label="Title" required error={show(key("title"))} className="sm:col-span-1">
          {(a) => (
            <Select {...a} value={passenger.title} onChange={pick("title")} onBlur={touch(key("title"))} placeholder="Select" options={["Mr", "Ms", "Mrs", "Mx"].map((t) => ({ value: t, label: t }))} />
          )}
        </Field>
        <Field label="First name" required error={show(key("firstName"))} className="sm:col-span-3" hint="As shown on passport or ID">
          {(a) => (
            <input {...a} value={passenger.firstName} onChange={set("firstName")} onBlur={touch(key("firstName"))} className={inputClass(!!show(key("firstName")))} autoComplete={first ? "given-name" : "off"} maxLength={40} />
          )}
        </Field>
        <Field label="Last name" required error={show(key("lastName"))} className="sm:col-span-2">
          {(a) => (
            <input {...a} value={passenger.lastName} onChange={set("lastName")} onBlur={touch(key("lastName"))} className={inputClass(!!show(key("lastName")))} autoComplete={first ? "family-name" : "off"} maxLength={40} />
          )}
        </Field>
        <Field label="Date of birth" required error={show(key("dateOfBirth"))} hint={hintByType[passenger.type]} className="sm:col-span-3">
          {(a) => (
            <DateField {...a} title="Choose date of birth" min="1900-01-01" max={todayIso()} value={passenger.dateOfBirth} onChange={pick("dateOfBirth")} onBlur={touch(key("dateOfBirth"))} placeholder="Select date of birth" />
          )}
        </Field>
        <Field label="Gender" required error={show(key("gender"))} className="sm:col-span-3">
          {(a) => (
            <Select {...a} value={passenger.gender} onChange={pick("gender")} onBlur={touch(key("gender"))} placeholder="Select" options={[{ value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }, { value: "OTHER", label: "Other" }]} />
          )}
        </Field>
      </div>
    </fieldset>
  );
}

export default function BookingForm() {
  const router = useRouter();
  const [selection, setSelection] = useState(undefined); // undefined = still reading storage
  const [passengers, setPassengers] = useState([]);
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [serverFields, setServerFields] = useState({});

  useEffect(() => {
    let parsed = null;
    try {
      parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      /* ignore: treated as no selection */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage only exists on the client
    setSelection(parsed?.flight && parsed?.search ? parsed : null);
    if (parsed?.search) setPassengers(buildPassengers(parsed.search));
  }, []);

  const travelDate = selection?.search?.departureDate;
  const clientErrors = useMemo(
    () => (selection ? validateBooking({ passengers, contact, consent }, travelDate) : {}),
    [selection, passengers, contact, consent, travelDate],
  );
  const errors = { ...serverFields, ...clientErrors };
  const show = (k) => (submitted || touched[k] ? errors[k] : undefined);
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const updatePassenger = (i, patch) => {
    setPassengers((list) => list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
    setServerFields({});
  };

  if (selection === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (selection === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={TicketX}
          title="No flight selected"
          description="Your selection has expired or wasn't saved. Search again and pick a flight to continue."
          action={
            <Link href="/#search" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
              Search flights
            </Link>
          }
        />
      </div>
    );
  }

  const { flight, search } = selection;
  const travellers = search.adults + search.children + search.infants;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setServerError(null);
    if (Object.keys(clientErrors).length > 0) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    try {
      const { booking } = await createBooking({
        flight,
        travellers: { adults: search.adults, children: search.children, infants: search.infants },
        passengers: passengers.map((p) => ({ ...p, firstName: p.firstName.trim(), lastName: p.lastName.trim() })),
        contact: { email: contact.email.trim(), phone: contact.phone.trim() },
      });
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/booking/${booking.reference}`);
    } catch (err) {
      setServerError(err.message);
      setServerFields(err.fields || {});
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <button type="button" onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to results
      </button>
      <h1 className="text-2xl font-bold tracking-tight">Passenger details</h1>
      <p className="mt-1 text-sm text-ink-soft">Enter names exactly as they appear on each traveller&apos;s passport or government ID.</p>

      {serverError && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-5">
          {passengers.map((p, i) => (
            <PassengerFieldset key={i} index={i} passenger={p} onChange={updatePassenger} show={show} touch={touch} />
          ))}

          <fieldset className="rounded-card bg-white p-5 shadow-card sm:p-6">
            <legend className="float-left mb-4 w-full text-base font-semibold">Contact details</legend>
            <div className="clear-both grid gap-4 sm:grid-cols-2">
              <Field label="Email" required error={show("contact.email")} hint="We'll send your booking confirmation here">
                {(a) => (
                  <input {...a} type="email" inputMode="email" autoComplete="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} onBlur={touch("contact.email")} className={inputClass(!!show("contact.email"))} />
                )}
              </Field>
              <Field label="Phone" required error={show("contact.phone")} hint="Include country code, e.g. +91 98765 43210">
                {(a) => (
                  <input {...a} type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} onBlur={touch("contact.phone")} className={inputClass(!!show("contact.phone"))} />
                )}
              </Field>
            </div>
          </fieldset>

          <div>
            <label className="flex cursor-pointer items-start gap-3 rounded-card bg-white p-5 shadow-card">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                onBlur={touch("consent")}
                aria-invalid={show("consent") ? true : undefined}
                aria-describedby={show("consent") ? "consent-error" : undefined}
                className="mt-0.5 size-5 shrink-0 accent-brand-600"
              />
              <span className="text-sm text-ink-soft">I confirm the passenger names match their travel documents and that this is a demo booking — no payment is taken.</span>
            </label>
            {show("consent") && (
              <p id="consent-error" role="alert" className="mt-1.5 text-xs font-medium text-danger">
                {show("consent")}
              </p>
            )}
          </div>
        </div>

        <aside aria-label="Trip summary" className="space-y-4 rounded-card bg-white p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">
            {cityOf(search.origin.label)} → {cityOf(search.destination.label)}
          </h2>
          <ItinerarySummary itinerary={flight.itineraries[0]} label={flight.itineraries[1] ? "Outbound" : undefined} />
          {flight.itineraries[1] && <ItinerarySummary itinerary={flight.itineraries[1]} label="Return" />}
          <hr className="border-line" />
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>
                {travellers} traveller{travellers > 1 ? "s" : ""}
              </dt>
              <dd>Taxes &amp; fees incl.</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="font-semibold">Total</dt>
              <dd className="text-2xl font-bold tabular-nums">{formatPrice(flight.price.total, flight.price.currency)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" loading={saving} className="w-full">
            {saving ? "Confirming…" : "Confirm booking"}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> Demo only. No payment details are collected.
          </p>
        </aside>
      </form>
    </div>
  );
}
