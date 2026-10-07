"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search } from "lucide-react";
import AirportCombobox from "./AirportCombobox";
import DateTile from "./DateTile";
import TravellersPicker from "./TravellersPicker";
import Button from "@/components/ui/Button";
import { CLASS_LABELS, todayIso } from "@/lib/format";
import { emptySearch, toQuery, validateSearch } from "@/lib/search";

const TRIP_TYPES = [
  ["ONE_WAY", "One Way"],
  ["ROUND_TRIP", "Round Trip"],
];

export default function SearchForm({ defaultValues, onSubmitted, showTabs = true }) {
  const router = useRouter();
  const [values, setValues] = useState(() => defaultValues ?? emptySearch());
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [swapKey, setSwapKey] = useState(0); // remount comboboxes so their text follows a swap

  const errors = validateSearch(values);
  const show = (field) => (submitted || touched[field] ? errors[field] : undefined);
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));
  const update = (patch) => setValues((v) => ({ ...v, ...patch }));
  const today = todayIso();
  const roundTrip = values.tripType === "ROUND_TRIP";

  const swap = () => {
    setValues((v) => ({ ...v, origin: v.destination, destination: v.origin }));
    setSwapKey((k) => k + 1);
  };

  const onDepartureChange = (departureDate) => {
    // keep the return date valid when the outbound moves past it
    update({
      departureDate,
      returnDate: values.returnDate && departureDate && values.returnDate < departureDate ? departureDate : values.returnDate,
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      // move focus to the first problem so keyboard/screen-reader users land on it
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    router.push(`/flights?${toQuery(values).toString()}`);
    onSubmitted?.();
  };

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Search flights">
      {showTabs && (
        <div className="-mx-5 -mt-5 mb-5 flex gap-1 border-b border-line px-5 sm:-mx-7 sm:-mt-7 sm:px-7">
          <span className="-mb-px border-b-[3px] border-brand-600 px-3 py-4 text-sm font-bold text-brand-700">Book Flight</span>
          <Link href="/manage" className="-mb-px border-b-[3px] border-transparent px-3 py-4 text-sm font-semibold text-ink-soft hover:text-brand-700">
            Manage Booking
          </Link>
        </div>
      )}

      <fieldset className="mb-4">
        <legend className="sr-only">Trip type</legend>
        <div className="flex gap-6" role="radiogroup" aria-label="Trip type">
          {TRIP_TYPES.map(([val, text]) => (
            <label key={val} className="flex cursor-pointer items-center gap-2 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-brand-600">
              <input
                type="radio"
                name="tripType"
                value={val}
                checked={values.tripType === val}
                onChange={() => update({ tripType: val })}
                className="size-[18px] accent-brand-600"
              />
              {text}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 lg:grid-cols-[2.5fr_1fr_1fr_1.1fr]">
        <div className="relative grid gap-3 sm:grid-cols-2">
          <AirportCombobox
            key={`o-${swapKey}`}
            label="From"
            placeholder="Departure city"
            value={values.origin}
            onChange={(origin) => update({ origin })}
            onBlur={touch("origin")}
            error={show("origin")}
          />
          <button
            type="button"
            onClick={swap}
            aria-label="Swap departure and destination"
            className="absolute right-4 top-[70px] z-10 grid size-10 place-items-center rounded-full border border-line bg-white text-brand-700 shadow-sm hover:bg-brand-50 sm:left-1/2 sm:right-auto sm:top-[22px] sm:-translate-x-1/2"
          >
            <ArrowLeftRight className="size-4 rotate-90 sm:rotate-0" aria-hidden="true" />
          </button>
          <AirportCombobox
            key={`d-${swapKey}`}
            label="To"
            placeholder="Destination city"
            value={values.destination}
            onChange={(destination) => update({ destination })}
            onBlur={touch("destination")}
            error={show("destination")}
          />
        </div>

        <DateTile label="Departure" value={values.departureDate} min={today} onChange={onDepartureChange} onBlur={touch("departureDate")} rangeFrom={values.departureDate} rangeTo={roundTrip ? values.returnDate : undefined} error={show("departureDate")} />
        <DateTile
          label="Return"
          value={values.returnDate}
          min={values.departureDate || today}
          onChange={(returnDate) => update({ returnDate })}
          onBlur={touch("returnDate")}
          error={show("returnDate")}
          align="right"
          rangeFrom={values.departureDate}
          rangeTo={values.returnDate}
          inactive={!roundTrip}
          onActivate={() => update({ tripType: "ROUND_TRIP" })}
          inactiveHint="Tap to book a round trip"
        />
        <TravellersPicker value={values} onChange={(patch) => update(patch)} />
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <fieldset>
            <legend className="sr-only">Cabin class</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cabin class">
              {Object.entries(CLASS_LABELS).map(([val, text]) => (
                <label
                  key={val}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
                    values.travelClass === val ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-soft hover:border-brand-200"
                  }`}
                >
                  <input type="radio" name="travelClass" value={val} checked={values.travelClass === val} onChange={() => update({ travelClass: val })} className="sr-only" />
                  {text}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
            <input type="checkbox" checked={values.nonStop} onChange={(e) => update({ nonStop: e.target.checked })} className="size-4 accent-brand-600" />
            Non-stop only
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full lg:w-auto lg:min-w-52">
          <Search className="size-5" aria-hidden="true" />
          Search Flight
        </Button>
      </div>
    </form>
  );
}
