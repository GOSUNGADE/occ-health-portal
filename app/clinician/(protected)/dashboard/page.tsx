"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  assigned_today: number;
  pending_assessments: number;
  completed_this_week: number;
};

export default function ClinicianDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    assigned_today: 0,
    pending_assessments: 0,
    completed_this_week: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch("/api/clinician/dashboard", {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setStats({
          assigned_today: Number(data.assigned_today || 0),
          pending_assessments: Number(data.pending_assessments || 0),
          completed_this_week: Number(data.completed_this_week || 0),
        });
      }
    }
    loadDashboard();
  }, []);

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
          <div className="mt-2 text-3xl font-semibold">
            {stats.assigned_today}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Pending Assessments</div>
          <div className="mt-2 text-3xl font-semibold">
            {stats.pending_assessments}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Completed This Week</div>
          <div className="mt-2 text-3xl font-semibold">
            {stats.completed_this_week}
          </div>
        </div>
      </div>
    </div>
  );
}