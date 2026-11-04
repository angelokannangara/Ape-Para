# Ape Para

A mobile app for reporting community issues in Sri Lanka and following their progress.

## Run the demo

```powershell
flutter pub get
flutter run
```

The app runs with its built-in demo login and data when no backend credentials are configured.

## Connect Supabase

Pass the Supabase project URL and publishable/anonymous key at startup:

```powershell
flutter run `
  --dart-define=SUPABASE_URL=https://your-project.supabase.co `
  --dart-define=SUPABASE_ANON_KEY=your-publishable-key
```

Google sign-in also requires a Google web client ID:

```powershell
flutter run --dart-define=GOOGLE_WEB_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Enable **Phone** and **Google** under Supabase Authentication > Sign In / Providers.
Phone login requires an SMS provider such as Twilio in the Supabase dashboard.

For Android Google sign-in, register both:

- the Android SHA-1 certificate fingerprint
- the same Web OAuth client ID passed above

Restart the app after changing `--dart-define` values.
