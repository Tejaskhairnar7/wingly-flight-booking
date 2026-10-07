# DESIGN.md — Wingly

**Product**: consumer flight search & booking (demo). **Audience**: general travellers, mobile-first.
**Stack**: Next.js App Router (JS), Tailwind v4 (tokens in `app/globals.css` `@theme`), lucide-react icons, Inter font.

## Decisions
- IndiGo-style search widget: tiles in `components/search/tile.js` (label / big value / sub-line). Light theme only (`color-scheme: light`). Add dark tokens before enabling dark mode.
- Tokens: `brand-*`, `ink*`, `line`, `canvas`, `surface`, `success|warning|danger(-soft)`, `rounded-card`, `shadow-card|pop`. Never use raw hex in components.
- Shared UI: `components/ui` (Button, Field + `inputClass`, States: Skeleton/EmptyState/ErrorState). New form controls must use `Field` for label/error/hint wiring.
- Search state lives in the URL (`/flights?...`); `lib/search.js` converts form values <-> query. Selected flight passes to `/book` via `sessionStorage["wingly:selection"]`.
- Fetching: plain `fetch` in `lib/api.js` with `AbortController`; request-in-flight is derived from a request key, not set in effects.
- Dates from Duffel are local wall-clock strings; format with `lib/format.js` (never `new Date(iso)` in the browser timezone).
- Money formatted with `Intl.NumberFormat`; server holds totals as numbers in the offer currency.
- Validation: errors shown after blur or submit attempt; focus moves to first invalid field. Server mirrors rules in zod (`server/src/lib/schemas.js`).
- No demo/mock flight data. Provider errors (missing keys, quota, provider messages) are shown to the user via ErrorState.

- No native `<select>` / `<input type="date">` (browser-styled popups break the theme). Use `components/ui/Select` (listbox), `DateField` (form input + month/year dropdowns) and `DatePopover` + `Calendar` (search tiles; bottom sheet below `sm`). Dates are always "YYYY-MM-DD" strings.
- Motion lives in `app/motion.css` (`anim-fade-up`, `anim-pop`, `anim-sheet`, `.reveal` via `components/ui/Reveal.js`). Animate only transform/opacity; reduced-motion is handled globally in `globals.css`.
- Print: `app/print.css` hides header/footer and the confirmation page uses `print:` utilities so a booking prints on one A4 page (sections use `.print-avoid-break`).
