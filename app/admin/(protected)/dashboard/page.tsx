"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  total_clinicians: number;
  active_clinicians: number;
  total_admins: number;
  active_admins: number;
  total_bookings: number;
  pending_bookings: number;
  completed_bookings: number;
  bookings_last_30_days: number;
  total_employers: number;
};

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: number | null;
  sub?: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {value ?? "--"}
        </p>
      )}
      {sub && !loading && (
        <p className="mt-1 text-xs text-gray-400">{sub}</p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load stats.");
          return;
        }
        setStats(data);
      } catch {
        setError("Something went wrong loading the dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-sm text-gray-600">
          Manage clinician accounts and platform access.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Clinicians */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Clinicians
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Clinicians"
            value={stats?.total_clinicians ?? null}
            loading={loading}
          />
          <StatCard
            label="Active Clinicians"
            value={stats?.active_clinicians ?? null}
            sub={stats ? `${stats.total_clinicians - stats.active_clinicians} inactive` : undefined}
            loading={loading}
          />
        </div>
      </div>

      {/* Bookings */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Bookings
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Bookings"
            value={stats?.total_bookings ?? null}
            loading={loading}
          />
          <StatCard
            label="Pending"
            value={stats?.pending_bookings ?? null}
            loading={loading}
          />
          <StatCard
            label="Completed"
            value={stats?.completed_bookings ?? null}
            loading={loading}
          />
          <StatCard
            label="Last 30 Days"
            value={stats?.bookings_last_30_days ?? null}
            loading={loading}
          />
        </div>
      </div>

      {/* Platform */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Platform
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Active Employers"
            value={stats?.total_employers ?? null}
            loading={loading}
          />
          <StatCard
            label="Total Admins"
            value={stats?.total_admins ?? null}
            sub={stats ? `${stats.active_admins} active` : undefined}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}