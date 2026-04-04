export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400">User preferences and system configuration</p>
      </div>
      <div className="bg-card rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <p className="text-gray-400">User profile management coming soon.</p>
      </div>
      <div className="bg-card rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">API Keys</h2>
        <p className="text-gray-400">Manage your Mapbox and Sentinel Hub API keys here.</p>
      </div>
      <div className="bg-card rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <p className="text-gray-400">Configure email, webhook, and push notification settings.</p>
      </div>
    </div>
  )
}
