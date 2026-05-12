// MY STUDIO — Settings Page
// PURPOSE: User settings, API keys, preferences

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="mt-2 text-text-secondary">
          Manage your account, API keys, and platform preferences.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-1 p-8 text-center">
        <p className="text-text-secondary">
          Settings interface will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
}

export { SettingsPage as default };
