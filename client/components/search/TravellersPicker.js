"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { MAX_TRAVELLERS } from "@/lib/search";
import { tileClass, tileLabelClass, tileSubClass, tileValueClass } from "./tile";

function Stepper({ label, hint, value, min, canIncrease, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-faint">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid size-9 place-items-center rounded-full border border-line text-ink hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={!canIncrease}
          onClick={() => onChange(value + 1)}
          className="grid size-9 place-items-center rounded-full border border-line text-ink hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function TravellersPicker({ value, onChange }) {
  const uid = useId();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const { adults, children, infants } = value;
  const total = adults + children + infants;
  const seated = adults + children;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = (patch) => {
    const next = { adults, children, infants, ...patch };
    if (next.infants > next.adults) next.infants = next.adults; // each infant needs an adult
    onChange(next);
  };

  const parts = [`${adults} Adult${adults > 1 ? "s" : ""}`];
  if (children) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);
  if (infants) parts.push(`${infants} Infant${infants > 1 ? "s" : ""}`);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${uid}-panel`}
        aria-label={`Passengers: ${parts.join(", ")}. Change`}
        onClick={() => setOpen((o) => !o)}
        className={`${tileClass(false)} w-full cursor-pointer`}
      >
        <span className={tileLabelClass}>Passengers</span>
        <span className={`${tileValueClass} flex items-center justify-between`}>
          {total} Traveller{total > 1 ? "s" : ""}
          <ChevronDown className={`size-4 shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
        <span className={tileSubClass}>{parts.join(", ")}</span>
      </button>

      {open && (
        <div
          id={`${uid}-panel`}
          role="group"
          aria-label="Passengers"
          className="anim-pop absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-4 shadow-pop"
        >
          <div className="divide-y divide-line">
            <Stepper label="Adults" hint="12 years and above" value={adults} min={1} canIncrease={seated < MAX_TRAVELLERS} onChange={(n) => set({ adults: n })} />
            <Stepper label="Children" hint="2–11 years" value={children} min={0} canIncrease={seated < MAX_TRAVELLERS} onChange={(n) => set({ children: n })} />
            <Stepper label="Infants" hint="Under 2, on lap" value={infants} min={0} canIncrease={infants < adults} onChange={(n) => set({ infants: n })} />
          </div>
          <p className="mt-2 text-xs text-ink-faint">Up to {MAX_TRAVELLERS} travellers. Each infant travels with one adult.</p>
          <Button className="mt-3 w-full" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
