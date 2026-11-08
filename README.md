# Ape Para (අපේ පාර)

A civic reporting web app for Sri Lanka. Citizens report potholes, garbage dumping, broken street lights and drainage blocks with a photo and a map pin; the backend routes each report to the right authority (Municipal Council, CEB, Water Board) by category and GPS location.

Stack: Node.js + Express, PostgreSQL + PostGIS, React + Tailwind.

```
Ape-Para/
├── database/
│   ├── schema.sql            # enums, users, departments, reports, notifications, indexes, trigger
│   └── seed.sql              # 3 sample departments (Colombo pilot polygons — placeholders)
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── app.js  server.js  config.js  db.js
│   │   ├── middleware/       # auth.js (JWT + RBAC), upload.js (multer + magic-byte check), error.js
│   │   ├── services/         # routing.js (automated routing), notifications.js
│   │   └── routes/           # auth, reports, departments, notifications, users
│   └── scripts/              # migrate.js, create-admin.js
├── frontend/                 # React 18 + Vite + Tailwind + Leaflet
│   └── src/
│       ├── context/AuthContext.jsx      # JWT state
│       ├── lib/                         # api client, constants
│       ├── components/                  # Layout, MapPicker, ReportsMap, NotificationBell, ...
│       └── pages/                       # Login, Register, Dashboard, NewReport
└── docker-compose.yml        # postgis/postgis for local dev
```

## Run locally

```bash
docker compose up -d db                       # or use any PostgreSQL 14+ with PostGIS 3
cd backend
cp .env.example .env                          # set JWT_SECRET (see comment in file)
npm install
npm run migrate                               # applies schema.sql + seed.sql (idempotent)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run create-admin
npm run dev                                   # http://localhost:4000

cd ../frontend
npm install
npm run dev                                   # http://localhost:5173 (proxies /api and /uploads)
```

## API

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | Always creates a **citizen** |
| POST | `/api/auth/login` | public | Returns `{ token, user }` |
| GET | `/api/auth/me` | any | |
| POST | `/api/reports` | citizen, admin | `multipart/form-data`: title, description, category, lat, lng, image? — **triggers automated routing** |
| GET | `/api/reports` | any | Scoped: citizen → own, field worker → own department, admin → all. `?status=&category=&limit=&offset=` |
| GET | `/api/reports/:id` | any | Same scoping |
| PATCH | `/api/reports/:id/status` | field_worker (own dept), admin | Notifies the reporter |
| PATCH | `/api/reports/:id/department` | admin | Manual reassignment / triage |
| GET | `/api/departments` | public | No polygons |
| GET | `/api/departments/resolve?lat&lng&category` | public | Routing preview used by the form |
| GET / POST | `/api/notifications`, `/api/notifications/read` | any | |
| POST | `/api/users/staff` | admin | Create field workers / admins |

## How automated routing works (`backend/src/services/routing.js`)

1. **Category rule** → authority type: pothole & garbage → `municipal`, street light → `ceb`, drainage → `water_board`.
2. **Spatial rule** → among departments of that type, `ST_Covers(region_polygon, point)`; if regions overlap, the smallest wins.
3. **Fallback** → nearest department of that type within `ROUTING_FALLBACK_KM` (default 50 km), recorded as `routing_method = 'nearest'`.
4. **Otherwise** → left unrouted (`assigned_department_id IS NULL`) for an admin to assign.

`routing_method` (`polygon` / `nearest` / `manual` / `unrouted`) is stored on each report so you can audit and improve boundaries.

## Things to know before production

- **Boundaries are placeholders.** `seed.sql` reuses the four approximate rectangles from `lib/services/jurisdictions.dart` (three fit the `municipal | ceb | water_board` types; the RDA one does not). Load real divisional/CEB/NWSDB boundaries (e.g. from shapefiles via `shp2pgsql` or `ogr2ogr`) before relying on routing.
- **Drainage → Water Board** is an assumption. In many areas storm drains belong to the Municipal Council; change `CATEGORY_TO_DEPARTMENT_TYPE` if so.
- **Image storage** is local disk (`UPLOAD_DIR`). On PaaS/ephemeral hosts, swap `middleware/upload.js` for S3/Cloud Storage.
- **JWT is kept in `localStorage`** (simple, but readable by any XSS). For higher assurance, move to an httpOnly, SameSite cookie.
- **Email/SMS** to departments is not implemented; notifications are in-app only (polled every 60 s).
- The map is keyboard-inaccessible by nature, so the form also offers latitude/longitude fields and "Use my location".
- Tiles use the public OpenStreetMap server, which has a usage policy; use a tile provider for real traffic.
- Run behind HTTPS and set `CORS_ORIGIN` to your real frontend origin(s).
