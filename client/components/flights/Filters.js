"use client";

import { formatPrice } from "@/lib/format";
import Button from "@/components/ui/Button";

export const TIME_BUCKETS = [
  { id: "early", label: "Early morning", hint: "00:00 – 05:59", from: 0, to: 6 },
  { id: "morning", label: "Morning", hint: "06:00 – 11:59", from: 6, to: 12 },
  { id: "afternoon", label: "Afternoon", hint: "12:00 – 17:59", from: 12, to: 18 },
  { id: "evening", label: "Evening", hint: "18:00 – 23:59", from: 18, to: 24 },
];

export const defaultFilters = (maxPrice) => ({ stops: [], airlines: [], times: [], maxPrice });

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-line py-4 first:pt-0 last:border-0">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm hover:bg-brand-50">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 rounded border-line accent-brand-600" />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export default function Filters({ filters, onChange, bounds, airlines, currency, activeCount, onReset }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Filters</h2>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset ({activeCount})
          </Button>
        )}
      </div>

      <Group title="Stops">
        {[
          [0, "Non-stop"],
          [1, "1 stop"],
          [2, "2+ stops"],
        ].map(([val, label]) => (
          <Check key={val} label={label} checked={filters.stops.includes(val)} onChange={() => onChange({ stops: toggle(filters.stops, val) })} />
        ))}
      </Group>

      <Group title="Price (total)">
        <input
          type="range"
          aria-label="Maximum price"
          min={bounds.min}
          max={bounds.max}
          step={Math.max(1, Math.round((bounds.max - bounds.min) / 50))}
          value={filters.maxPrice}
          onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
          className="w-full accent-brand-600"
        />
        <p className="text-xs text-ink-soft">
          Up to <strong className="text-ink">{formatPrice(filters.maxPrice, currency)}</strong>
        </p>
      </Group>

      <Group title="Outbound departure">
        {TIME_BUCKETS.map((b) => (
          <Check key={b.id} label={b.label} hint={b.hint} checked={filters.times.includes(b.id)} onChange={() => onChange({ times: toggle(filters.times, b.id) })} />
        ))}
      </Group>

      <Group title="Airlines">
        {airlines.map((a) => (
          <Check
            key={a.name}
            label={a.name}
            hint={formatPrice(a.minPrice, currency)}
            checked={filters.airlines.includes(a.name)}
            onChange={() => onChange({ airlines: toggle(filters.airlines, a.name) })}
          />
        ))}
      </Group>
    </div>
  );
}
