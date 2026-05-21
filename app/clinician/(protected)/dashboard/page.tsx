export default function ClinicianDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Clinician Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome to the clinician portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Assigned Today</div>
          <div className="mt-2 text-3xl font-semibold">0</div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Pending Assessments</div>
          <div className="mt-2 text-3xl font-semibold">0</div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Completed This Week</div>
          <div className="mt-2 text-3xl font-semibold">0</div>
        </div>
      </div>
    </div>
  );
}
