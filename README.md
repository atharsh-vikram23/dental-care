# Dr. Deleep Dental Care — Full-Stack Website

A complete, self-hostable website for the clinic: a public booking site, a
Node.js/Express API, a MySQL database, and a small staff dashboard for
managing appointment requests.

```
dr-deleep-dental/
├── frontend/
│   ├── index.html        # Public site (services, booking form, FAQ, etc.)
│   └── admin/index.html  # Staff dashboard — view & update bookings
├── backend/
│   ├── server.js         # Express app entry point
│   ├── src/
│   │   ├── config/        # DB pool + clinic hours/slot config
│   │   ├── controllers/    # Business logic per resource
│   │   ├── middleware/     # Admin API-key auth
│   │   ├── routes/         # /api/services, /api/slots, /api/bookings, /api/admin
│   │   └── db/init.js      # One-command DB setup (alternative to the mysql CLI)
│   ├── db/
│   │   ├── schema.sql      # Tables: services, bookings, clinic_hours
│   │   └── seed.sql        # The clinic's 15 preventive services
│   ├── package.json
│   └── .env.example
└── README.md
```

## What it does

- **Public site** (`frontend/index.html`) lists all 15 services, lets a
  patient pick a real, live-checked time slot, and sends the booking to the
  clinic's WhatsApp — while also saving it to MySQL as a `pending` booking.
- **API** exposes services from the database (so the clinic can edit the
  list without touching frontend code), live slot availability per day, and
  a booking endpoint that's race-condition-safe (a MySQL transaction with
  `FOR UPDATE` stops two patients grabbing the same slot at once).
- **Staff dashboard** (`frontend/admin/index.html`) is a lightweight,
  API-key-protected page to see incoming bookings and mark them
  confirmed/cancelled/completed.
- Everything **degrades gracefully**: if `API_BASE_URL` is left blank or the
  backend is unreachable, the public site still works off a built-in list
  of services and a static time list, and booking still works over
  WhatsApp — it just won't check live availability against the database.

## 1. Set up MySQL

You need a MySQL 8.x server (local install, Docker, or a managed host like
PlanetScale/RDS/Cloud SQL). Then run:

```bash
mysql -u root -p < backend/db/schema.sql
mysql -u root -p dr_deleep_dental < backend/db/seed.sql
```

`schema.sql` also creates a least-privilege `dental_app` user — **change its
password** in `schema.sql` before running it (or `ALTER USER` afterward),
and use the same password in `backend/.env`.

Alternative (no `mysql` CLI required): fill in `backend/.env` with a MySQL
user that can `CREATE DATABASE`, then run `npm run db:init` from `backend/`.

## 2. Configure and run the backend

```bash
cd backend
cp .env.example .env      # then edit DB_*, ADMIN_API_KEY, CORS_ORIGIN
npm install
npm start                 # or: npm run dev  (auto-restarts on changes)
```

The API listens on `http://localhost:4000` by default. Check it's up:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/services
```

## 3. Point the frontend at the API

In `frontend/index.html`, find this line near the top of the `<script>`
block and set it to your API's URL:

```js
const API_BASE_URL = "http://localhost:4000"; // or your deployed API URL
```

Do the same in `frontend/admin/index.html`. Then open `frontend/index.html`
directly in a browser, or serve it with any static host (Nginx, Vercel,
Netlify, GitHub Pages, etc.) — it's plain HTML/CSS/JS, no build step.

## 4. Sign in to the staff dashboard

Open `frontend/admin/index.html`, and enter the `ADMIN_API_KEY` value from
`backend/.env` when prompted. From there staff can filter bookings by date
or status and update each one's status.

## API reference

| Method | Path                     | Auth        | Purpose |
|--------|--------------------------|-------------|---------|
| GET    | `/health`                | none        | Liveness check |
| GET    | `/api/services`          | none        | List active services |
| GET    | `/api/slots?date=`       | none        | Slot availability for a date |
| POST   | `/api/bookings`          | none, rate-limited | Create a booking |
| GET    | `/api/admin/bookings`    | `x-admin-key` header | List bookings (filter by `date`, `status`) |
| PATCH  | `/api/admin/bookings/:id`| `x-admin-key` header | Update a booking's status |

## Notes on going to production

- Put the backend behind HTTPS (e.g. a reverse proxy like Nginx or Caddy, or
  a platform that terminates TLS for you) — the admin key and patient data
  should never travel in plaintext.
- Set `CORS_ORIGIN` in `.env` to your real site URL(s), not `*`.
- Replace the single shared `ADMIN_API_KEY` with per-staff logins if more
  than one person needs access and you want an audit trail.
- Take regular MySQL backups (`mysqldump`) — this database is the clinic's
  appointment record.
