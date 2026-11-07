/// Project setup and deployment guide for Ape Para.
# Ape Para

Ape Para is a mobile-first civic reporting platform for Sri Lanka that lets citizens submit photo, location, and issue details and route reports to the appropriate authority.

## Firebase setup in 6 steps

1. Create a Firebase project.
2. Enable Email/Password in Authentication.
3. Create Firestore Database and apply `firestore.rules`.
4. Enable Firebase Storage and apply `storage.rules`.
5. Run `flutterfire configure` locally and generate Firebase web configuration values.
6. Deploy the rules and indexes with Firebase CLI when your project is ready.

## Run locally

```powershell
flutter pub get
Copy-Item dart_defines.example.json dart_defines.json
flutter run -d chrome --dart-define-from-file=dart_defines.json
```

Fill all seven Firebase values in `dart_defines.json`. This file is ignored by Git.

## Deploy to GitHub Pages

1. Create a GitHub repository and push the project to `main`.
2. Add all seven Firebase values under Repository Settings > Secrets and variables > Actions.
3. Enable GitHub Pages with Source: GitHub Actions.
4. Confirm the workflow base-href uses `/<repository-name>/`.
5. Push to `main` to build and publish the static site.

## What this costs

| Firebase resource | Pilot budget | Firebase Spark allowance |
|---|---:|---:|
| Firestore reads/writes | Suitable for about 1,000 reports/month | 50,000 reads and 20,000 writes per day |
| Storage | 5 to 10 GB available free | 5 GB stored |
| Storage downloads | Usually under 1 GB/month at pilot scale | 1 GB/day |
| Authentication | Included in Spark pilot usage | No monthly user-charge |
| Hosting | GitHub Pages | LKR 0 |

Total expected pilot cost: **LKR 0**.

## Known limitations

- The Spark plan has no Cloud Functions, so reports are not emailed automatically. Officers copy dispatch details from the dashboard.
- Push notifications are not implemented.
- Jurisdiction routing is performed in the browser and depends on the approximate seeded polygons.
- Officer role checks require one profile read per dashboard session.
- CanvasKit uses roughly 2 MB or more on first load.
- The public OpenStreetMap tile service may be unavailable or slow and the map degrades to a loading/error state.

## Build flags

CanvasKit is used for consistent Sinhala rendering across Chrome, Safari, and Firefox. HTML renderer text shaping can be inconsistent. The trade-off is a larger initial application download.

## Boundaries

The four jurisdiction polygons in `lib/services/jurisdictions.dart` are approximate placeholders. Supply vetted boundaries before production routing.

## Assets

`.nojekyll` prevents GitHub Pages from stripping Flutter asset directories such as `assets/` and `canvaskit/`.
