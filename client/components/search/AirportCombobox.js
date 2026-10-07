"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Building2, Loader2, PlaneTakeoff } from "lucide-react";
import { searchLocations } from "@/lib/api";
import { useDebounce } from "@/lib/hooks";
import { makeLocation } from "@/lib/search";
import { TileError, tileClass, tileLabelClass, tileSubClass, tileValueClass } from "./tile";

const MIN_CHARS = 2;

/**
 * Accessible autocomplete (WAI-ARIA combobox) backed by Duffel's place suggestions.
 * Typing is debounced, in-flight requests are cancelled when the text changes,
 * and results are cached per keyword.
 */
export default function AirportCombobox({ label, value, onChange, onBlur, error, placeholder }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const errorId = `${uid}-error`;
  const wrapRef = useRef(null);

  const [text, setText] = useState(value?.cityName ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [cache, setCache] = useState({}); // keyword -> locations
  const [failed, setFailed] = useState(null); // { key, message }
  const [retryTick, setRetryTick] = useState(0);

  const debounced = useDebounce(text.trim(), 350);
  const pending = text.trim().length >= MIN_CHARS && text.trim() !== debounced; // user still typing

  // Status is derived from what we have, so the effect only has to fetch.
  const keyword = debounced.toLowerCase();
  const eligible = debounced.length >= MIN_CHARS && !value;
  const results = (eligible && cache[keyword]) || [];
  const failKey = `${keyword}:${retryTick}`;
  let status = "idle";
  if (eligible) status = cache[keyword] ? "done" : failed?.key === failKey ? "error" : "loading";

  useEffect(() => {
    if (!eligible || cache[keyword]) return;
    const controller = new AbortController();
    searchLocations(debounced, controller.signal)
      .then(({ locations }) => setCache((c) => ({ ...c, [keyword]: locations })))
      .catch((err) => {
        if (err.name !== "AbortError") setFailed({ key: `${keyword}:${retryTick}`, message: err.message });
      });
    return () => controller.abort(); // typing again cancels the stale request
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cache is read only to skip known keywords
  }, [eligible, keyword, debounced, retryTick]);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const choose = (loc) => {
    const v = makeLocation({ iataCode: loc.iataCode, cityName: loc.cityName, name: loc.name });
    setText(v.cityName);
    onChange(v);
    setOpen(false);
  };

  // The first suggestion is highlighted by default so Enter picks it.
  const activeIdx = results.length ? Math.min(Math.max(active, 0), results.length - 1) : -1;

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(results.length ? (activeIdx + 1) % results.length : -1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(results.length ? (activeIdx - 1 + results.length) % results.length : -1);
    } else if (e.key === "Enter" && open && !value && status === "done" && results[activeIdx]) {
      e.preventDefault();
      choose(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && !value && text.trim().length > 0;

  let body = null;
  if (text.trim().length < MIN_CHARS) {
    body = <p className="px-4 py-3 text-sm text-ink-faint">Type at least {MIN_CHARS} letters of a city or airport</p>;
  } else if (pending || status === "loading") {
    body = (
      <p className="flex items-center gap-2 px-4 py-3 text-sm text-ink-soft" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Searching airports…
      </p>
    );
  } else if (status === "error") {
    body = (
      <div className="px-4 py-3 text-sm" role="alert">
        <p className="text-danger">{failed?.message || "Couldn't load airports."}</p>
        <button type="button" className="mt-1 font-semibold text-brand-700 underline" onClick={() => setRetryTick((n) => n + 1)}>
          Try again
        </button>
      </div>
    );
  } else if (status === "done" && results.length === 0) {
    body = <p className="px-4 py-3 text-sm text-ink-soft">No airports match “{text.trim()}”. Try a nearby city or the 3-letter code.</p>;
  } else if (status === "done") {
    body = (
      <ul id={listId} role="listbox" aria-label={`${label} suggestions`} className="max-h-72 overflow-auto py-1">
        {results.map((loc, i) => {
          const Icon = loc.type === "CITY" ? Building2 : PlaneTakeoff;
          return (
            <li
              key={`${loc.iataCode}-${loc.type}`}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onPointerDown={(e) => e.preventDefault() /* keep focus in the input */}
              onClick={() => choose(loc)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === activeIdx ? "bg-brand-50" : ""}`}
            >
              <Icon className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {loc.cityName}
                  {loc.countryName && <span className="font-normal text-ink-soft">, {loc.countryName}</span>}
                </span>
                <span className="block truncate text-xs text-ink-faint">
                  {loc.type === "CITY" ? "All airports" : loc.name}
                </span>
              </span>
              <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-bold tracking-wide text-ink-soft">{loc.iataCode}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={`${uid}-input`} className={tileClass(!!error)}>
        <span className={tileLabelClass}>{label}</span>
        <input
          id={`${uid}-input`}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && status === "done" && activeIdx >= 0 ? `${uid}-opt-${activeIdx}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          spellCheck={false}
          value={text}
          placeholder={placeholder}
          className={tileValueClass}
          onChange={(e) => {
            setText(e.target.value);
            if (value) onChange(null); // editing invalidates the previous selection
            setOpen(true);
            setActive(-1);
          }}
          onFocus={(e) => {
            setOpen(true);
            if (value) e.target.select();
          }}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <span className={tileSubClass}>{value ? `${value.iataCode}${value.name ? `, ${value.name}` : ""}` : "City or airport"}</span>
      </label>
      {showPanel && (
        <div className="anim-pop absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-pop sm:min-w-[340px]">
          {body}
        </div>
      )}
      <TileError id={errorId}>{error}</TileError>
    </div>
  );
}
