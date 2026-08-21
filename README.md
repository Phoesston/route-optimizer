# Route Optimizer

A route-planning tool for field service and delivery work: add stops for the day, geocode them, and get back an optimized visiting order — then jump straight into turn-by-turn navigation on your phone.

## Features

- **Stops management** — add stops by address; each is geocoded to coordinates automatically.
- **Route optimization** — orders today's pending stops using Mapbox's Optimized Trips API.
- **Navigate handoff** — one tap opens the next stop in Apple Maps (iOS) or Google Maps (Android/desktop).
- **Accounts** — email/password auth, with each user's stops scoped to their own account.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [Drizzle ORM](https://orm.drizzle.team) over [Neon](https://neon.tech) Postgres
- [Auth.js v5](https://authjs.dev) (credentials provider, JWT sessions, bcrypt password hashing)
- [Zod](https://zod.dev) for request validation
- [Mapbox](https://www.mapbox.com) Geocoding and Optimization APIs
- [Vitest](https://vitest.dev) for tests

## Getting started

### Prerequisites

- Node.js 20+
- A Postgres database (e.g. a free [Neon](https://neon.tech) instance)
- A [Mapbox](https://www.mapbox.com) access token

### Setup

```bash
npm install
```

Create a `.env.local` in the project root:

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=          # generate with: npx auth secret
MAPBOX_TOKEN=         # server-side Mapbox token (geocoding, optimization)
NEXT_PUBLIC_MAPBOX_TOKEN=  # client-side Mapbox token (map rendering)
```

Push the schema to your database:

```bash
npx drizzle-kit push
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                       |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the dev server               |
| `npm run build` | Build for production               |
| `npm run start` | Start the production server        |
| `npm run lint`  | Run ESLint                         |
| `npx vitest`    | Run the test suite                 |

## Project structure

```
app/
  api/
    auth/[...nextauth]/  # Auth.js handlers
    geocode/             # address -> coordinates
    jobs/                # list/create stops
    optimize/            # reorder pending stops
  page.tsx               # dashboard UI
lib/
  auth/                  # Auth.js config, password hashing
  data/                  # database access (jobs)
  db/                    # Drizzle client + schema
  services/               # Mapbox route optimization
  validation.ts           # Zod schemas
drizzle/                  # generated SQL migrations
```

## Status

Actively in development. Core flows (auth, add stop, optimize route) are wired end to end; expect rough edges.
