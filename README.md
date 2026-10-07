# Wingly — flight search & booking

Next.js (JavaScript/JSX, App Router) + Tailwind CSS v4 frontend, Node/Express backend, MongoDB storage, **Amadeus Self-Service API** for all flight data. There is no static or generated flight data: if Amadeus can't answer, the UI shows the real error.

```
flight-booking/
├─ client/   Next.js app  (http://localhost:3000)
└─ server/   Express API  (http://localhost:5050)
```

## 1. Get Amadeus keys (required, free)

1. Sign up at https://developers.amadeus.com → **My Self-Service Workspace → Create new app**.
2. Put the API Key / Secret in `server/.env`:

```
AMADEUS_CLIENT_ID=...
AMADEUS_CLIENT_SECRET=...
AMADEUS_BASE_URL=https://test.api.amadeus.com
```

> The free **test** environment returns real-format but limited/cached data (popular routes such as DEL–BOM, LHR–JFK, MAD–PAR work best; far-future dates and obscure routes often return nothing). For full live inventory request production keys and set `AMADEUS_BASE_URL=https://api.amadeus.com`.

## 2. Run

Needs Node 20+ and MongoDB running locally.

```bash
cd server && cp .env.example .env && npm install && npm run dev   # API :5050
cd client && cp .env.example .env.local && npm install && npm run dev  # web :3000
```

`GET http://localhost:5050/api/health` shows `"amadeusConfigured": true` once keys are loaded.

## API

| Method | Path | Amadeus endpoint used |
|---|---|---|
| GET | `/api/locations?keyword=del` | Airport & City Search |
| GET | `/api/flights?origin&destination&departureDate&returnDate&adults&children&infants&travelClass&nonStop` | Flight Offers Search (normalised) |
| GET | `/api/flights/calendar?...same` | Flight Offers Search for ±3 days → fare strip |
| POST | `/api/bookings` | — validates and saves to MongoDB, returns a 6-char reference |
| GET | `/api/bookings/:reference` | — |

The API caches the OAuth token, de-duplicates identical in-flight requests, and caches successful responses for 5–10 minutes to protect the free quota.

## UI

- IndiGo-style booking widget: Book Flight / Manage Booking tabs, One Way / Round Trip, From–To tiles with swap, date tiles (tap "Add return" on one-way), passengers popover, cabin chips, non-stop toggle.
- Debounced (350 ms) airport autocomplete with request cancellation and caching; ARIA combobox keyboard support.
- Results: fare strip for nearby dates, sort, filters (stops, price, departure time, airline), flight details.
- Booking: per-passenger form with age rules, email/phone validation (mirrored on the server), saved in MongoDB.

Payments are intentionally not implemented.
