export default function SetupNeeded() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-maroon-800">Almost there</h1>
        <p className="mt-2 text-ink-700">
          This site is not connected to Firebase yet. Add these environment variables and rebuild:
        </p>
        <ul className="mt-3 list-disc pl-6 font-mono text-sm">
          <li>VITE_FIREBASE_API_KEY</li><li>VITE_FIREBASE_AUTH_DOMAIN</li>
          <li>VITE_FIREBASE_PROJECT_ID</li><li>VITE_FIREBASE_APP_ID</li>
        </ul>
        <p className="mt-3 text-sm text-ink-700">See README.md for where to find them in the Firebase console.</p>
      </div>
    </main>
  );
}
