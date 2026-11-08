# Ape Para (අපේ පාර)

A civic reporting web app for Sri Lanka. Citizens report potholes, garbage dumping, broken street lights and drainage blocks with a photo and a map pin. Each report is routed automatically to the right authority (Municipal Council, CEB, Water Board) by category and GPS location.

**Stack:** React + Vite + Tailwind + Leaflet, Firebase Authentication + Cloud Firestore. No server and no paid plan: it runs on Firebase's free **Spark** plan.

```
Ape-Para/
├── firestore.rules          # security rules = the access control (no server!)
├── firestore.indexes.json
├── firebase.json            # optional: Firebase Hosting + rules deploy
└── frontend/
    ├── .env.example         # Firebase web config (VITE_FIREBASE_*)
    └── src/
        ├── context/AuthContext.jsx     # Firebase Auth + user profile/role
        ├── lib/
        │   ├── routing.js              # automated routing (+ routing.test.js)
        │   ├── db.js                   # all Firestore reads/writes
        │   ├── image.js                # shrinks photos before saving
        │   └── sampleDepartments.js
        ├── components/  pages/         # Login, Register, Dashboard, NewReport, Admin
```

## Setup

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** (Analytics not needed). It starts on the free Spark plan; do not upgrade.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** → choose a region (asia-south1 Mumbai is closest to Sri Lanka) → start in **production mode**.
4. In Firestore, open the **Rules** tab, replace everything with the contents of `firestore.rules`, and click **Publish**.
5. **Project settings (gear) → Your apps → Web (`</>`)** → register an app. Copy the config values it shows.

### 2. Configure the frontend
Local development:
```bash
cd frontend
cp .env.example .env.local      # fill in the four VITE_FIREBASE_* values
npm install
npm run dev                     # http://localhost:5173
npm test                        # routing unit tests
```
On Vercel: **Settings → Environment Variables**, add the same four `VITE_FIREBASE_*` variables, then **Redeploy**. (Root Directory = `frontend`.) The old `VITE_API_URL` is no longer used.

Then in Firebase: **Authentication → Settings → Authorized domains → Add domain** and add your Vercel domain (e.g. `ape-para.vercel.app`), otherwise login is blocked.

These Firebase config values are not secrets; the security rules protect the data.

### 3. Make yourself admin (one time)
1. Open the site and **register**.
2. In the Firebase console: **Firestore → users →** your document → change `role` from `citizen` to `admin`.
3. Log out and back in. An **Admin** link appears: click **Add sample Colombo departments**.

To create field workers: they register normally, then in **Admin → Staff access** find them by email and set role *Field worker* + department.

## Roles
| Role | Can do |
|---|---|
| citizen | Submit reports; see only their own; get notifications |
| field_worker | See and update the status of reports routed to their department |
| admin | See all reports, reassign them, manage departments and staff roles |

## How routing works (`frontend/src/lib/routing.js`)
1. Category → authority type: pothole & garbage → municipal, street light → CEB, drainage → water board.
2. The department of that type whose boundary contains the pin (smallest wins if they overlap).
3. Otherwise the nearest of that type within 50 km (`routing_method: nearest`).
4. Otherwise unrouted; an admin assigns it from the dashboard.

## Know the trade-offs (Spark plan, no server)
- **Routing runs in the browser.** A determined user could tamper with their own report's department. Rules limit it to a real department and admins can reassign, but it is not tamper-proof. Moving routing into a Cloud Function needs the paid Blaze plan.
- **Photos are stored in Firestore**, shrunk to about 250 KB JPEGs, because Cloud Storage now needs Blaze. The free 1 GiB holds a few thousand photos.
- **Free quotas:** about 50,000 reads and 20,000 writes per day. Plenty for a pilot; watch them if it grows.
- **Boundaries are placeholders.** The sample rectangles are approximate. Load real ones (admin page / Firestore `departments`, stored as `polygons: [{ points: [{lat, lng}] }]`) before relying on routing.
- **Drainage → Water Board** is an assumption; change `CATEGORY_TO_DEPARTMENT_TYPE` if your area differs.
- **No email/SMS.** Notifications are in-app and realtime.
- No rate limiting. Consider Firebase App Check before opening to the public.
- Map tiles use the public OpenStreetMap server; use a tile provider for real traffic.
