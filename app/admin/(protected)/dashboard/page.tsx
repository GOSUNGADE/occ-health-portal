export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-sm text-gray-600">
          Manage clinician accounts and platform access.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Clinicians</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Active Clinicians</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
        </div>
      </div>
    </div>
  );
}