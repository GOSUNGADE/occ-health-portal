"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseMedical,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

type Candidate = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Booking = {
  id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  appointment_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DashboardStats = {
  totalCandidates: number;
  activeBookings: number;
  completedAssessments: number;
  scheduledBookings: number;
  inProgressBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
};

function getApiError(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    return (typeof d.error === "string" ? d.error : null)
      || (typeof d.message === "string" ? d.message : null)
      || fallback;
  }
  return fallback;
}

function formatStatusLabel(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "NO_SHOW":
      return "No Show";
    default:
      return status;
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border border-red-100";
    case "NO_SHOW":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export default function EmployerDashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [candidatesRes, bookingsRes] = await Promise.all([
        fetch("/api/candidate", { cache: "no-store" }),
        fetch("/api/bookings", { cache: "no-store" }),
      ]);

      const candidatesData = await candidatesRes.json();
      const bookingsData = await bookingsRes.json();

      if (!candidatesRes.ok) {
        throw new Error(
          getApiError(candidatesData, "Failed to fetch candidates")
        );
      }

      if (!bookingsRes.ok) {
        throw new Error(getApiError(bookingsData, "Failed to fetch bookings"));
      }

      setCandidates(candidatesData.candidates || []);
      setBookings(bookingsData.bookings || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats: DashboardStats = useMemo(() => {
    const totalCandidates = candidates.length;
    const activeBookings = bookings.filter((booking) =>
      ["SCHEDULED", "IN_PROGRESS"].includes(booking.status)
    ).length;
    const completedAssessments = bookings.filter(
      (booking) => booking.status === "COMPLETED"
    ).length;
    const scheduledBookings = bookings.filter(
      (booking) => booking.status === "SCHEDULED"
    ).length;
    const inProgressBookings = bookings.filter(
      (booking) => booking.status === "IN_PROGRESS"
    ).length;
    const cancelledBookings = bookings.filter(
      (booking) => booking.status === "CANCELLED"
    ).length;
    const noShowBookings = bookings.filter(
      (booking) => booking.status === "NO_SHOW"
    ).length;

    return {
      totalCandidates,
      activeBookings,
      completedAssessments,
      scheduledBookings,
      inProgressBookings,
      cancelledBookings,
      noShowBookings,
    };
  }, [candidates, bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort(
        (a, b) =>
          new Date(b.appointment_date).getTime() -
          new Date(a.appointment_date).getTime()
      )
      .slice(0, 5);
  }, [bookings]);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-full bg-slate-50/70 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Welcome to your employer portal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/employer/candidates"
              className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <UserPlus size={16} />
              Manage Candidates
            </Link>

            <Link
              href="/employer/bookings"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"
            >
              <Plus size={16} />
              Create Booking
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Candidates
                </p>
                <p className="mt-4 text-4xl font-bold text-slate-900">
                  {stats.totalCandidates}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Candidates added by your company
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Users size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Bookings
                </p>
                <p className="mt-4 text-4xl font-bold text-slate-900">
                  {stats.activeBookings}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Scheduled and in-progress appointments
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <CalendarDays size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed Assessments
                </p>
                <p className="mt-4 text-4xl font-bold text-slate-900">
                  {stats.completedAssessments}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Medical outcomes received
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Bookings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest booking activity
                </p>
              </div>

              <Link
                href="/employer/bookings"
                className="text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-sm text-slate-500">
                    <th className="px-6 py-4 font-medium">Candidate</th>
                    <th className="px-6 py-4 font-medium">Appointment</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        No bookings yet.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-t">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {booking.candidate_name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {booking.candidate_email || "No email"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {new Date(booking.appointment_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                              booking.status
                            )}`}
                          >
                            {formatStatusLabel(booking.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <BriefcaseMedical size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Booking Status
                  </h2>
                  <p className="text-sm text-slate-500">
                    Current appointment breakdown
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                  <span className="text-sm font-medium text-emerald-700">
                    Scheduled
                  </span>
                  <span className="text-lg font-bold text-emerald-800">
                    {stats.scheduledBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                  <span className="text-sm font-medium text-blue-700">
                    In Progress
                  </span>
                  <span className="text-lg font-bold text-blue-800">
                    {stats.inProgressBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">
                    Completed
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {stats.completedAssessments}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3">
                  <span className="text-sm font-medium text-red-700">
                    Cancelled
                  </span>
                  <span className="text-lg font-bold text-red-800">
                    {stats.cancelledBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                  <span className="text-sm font-medium text-amber-700">
                    No Show
                  </span>
                  <span className="text-lg font-bold text-amber-800">
                    {stats.noShowBookings}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Clock3 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Quick Summary
                  </h2>
                  <p className="text-sm text-slate-500">
                    Snapshot of current portal activity
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Total bookings</span>
                  <span className="font-semibold text-slate-900">
                    {bookings.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total candidates</span>
                  <span className="font-semibold text-slate-900">
                    {candidates.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Open work</span>
                  <span className="font-semibold text-slate-900">
                    {stats.activeBookings}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
