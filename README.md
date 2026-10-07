# Wingly — flight search & booking

Next.js (JavaScript/JSX, App Router) + Tailwind CSS v4 frontend, Node/Express backend, MongoDB storage, and the **Duffel API** for all flight data. There is no static or generated flight data: if Duffel can't answer, the UI shows the real error.

```
flight-booking/
├─ client/   Next.js app  (http://localhost:3000)
└─ server/   Express API  (http://localhost:5050)
```

## 1. Get a Duffel access token (required, free)

1. Sign up at https://app.duffel.com.
2. Go to **Developers → Access tokens** and create a token.
3. Put it in `server/.env`:

```
DUFFEL_ACCESS_TOKEN=duffel_test_...
```

> A `duffel_test_...` token uses Duffel's sandbox: it returns realistic offers, including "Duffel Airways" test flights, but not live airline inventory. For live fares, complete Duffel's account verification, create a `duffel_live_...` token and use that instead. Prices come back in the airline's own currency.

## 2. Run locally

Needs Node 20+ and MongoDB running locally.

```bash
cd server && cp .env.example .env && npm install && npm run dev   # API :5050
cd client && cp .env.example .env.local && npm install && npm run dev  # web :3000
```

`GET http://localhost:5050/api/health` shows `"duffelConfigured": true` once the token is loaded (`duffelMode` is `test` or `live`).

### Environment variables

| Where | Variable | Purpose |
|---|---|---|
| `server/.env` | `DUFFEL_ACCESS_TOKEN` | Duffel token (required) |
| `server/.env` | `MONGODB_URI` | MongoDB connection string (default: local `flight_booking` DB) |
| `server/.env` | `CLIENT_ORIGIN` | Allowed CORS origin, i.e. the web app's URL |
| `server/.env` | `PORT` | API port (default `5050`) |
| `client/.env.local` | `NEXT_PUBLIC_API_URL` (or `NEXT_API_URL`) | API base URL ending in `/api`, e.g. `http://localhost:5050/api` |

## API

| Method | Path | Duffel endpoint used |
|---|---|---|
| GET | `/api/locations?keyword=del` | Place suggestions |
| GET | `/api/locations/nearby` | IP → city (ipwho.is), then Place suggestions by name / coordinates → default "From" airport |
| GET | `/api/flights?origin&destination&departureDate&returnDate&adults&children&infants&travelClass&nonStop` | Offer requests (normalised, cheapest first) |
| GET | `/api/flights/calendar?...same` | Offer requests for ±3 days → fare strip |
| POST | `/api/bookings` | — validates and saves to MongoDB, returns a 6-char reference |
| GET | `/api/bookings/:reference` | — |

Identical in-flight requests are de-duplicated and successful responses are cached for 5–10 minutes to stay within Duffel's rate limits. Duffel does not report remaining seats, so no "seats left" badge is shown.

## UI

- IndiGo-style booking widget: Book Flight / Manage Booking tabs, One Way / Round Trip, From–To tiles with swap, date tiles (tap "Add return" on one-way), passengers popover, cabin chips, non-stop toggle. "From" defaults to the airport nearest the visitor's IP-detected city.
- Themed dropdowns and calendars (no native `<select>` / date pickers); calendars rise as a bottom sheet on phones.
- Debounced (350 ms) airport autocomplete with request cancellation and caching; ARIA combobox keyboard support.
- Results: fare strip for nearby dates, sort, filters (stops, price, departure time, airline), flight details.
- Booking: per-passenger form with age rules, email/phone validation (mirrored on the server), saved in MongoDB. The confirmation prints on a single A4 page.
- Landing page: popular-destination cards with photos from Wikipedia / Wikimedia Commons, plus entrance and hover animations.

Payments are intentionally not implemented.

## Deploying

- **Client → Vercel**: import the repo, set *Root Directory* to `client`, add `NEXT_PUBLIC_API_URL=https://<your-api>/api`.
- **API → Render / Railway / Fly**: root directory `server`, build `npm install`, start `npm start`; set `MONGODB_URI`, `DUFFEL_ACCESS_TOKEN` and `CLIENT_ORIGIN` (your Vercel URL).
- **Database → MongoDB Atlas**: create a user and allow the API host in Network Access.
- Never commit `server/.env`; the Duffel token is a secret.
