"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClinicianBooking = {
  id: number;
  appointment_date: string;
  appointment_time: string | null;
  clinic_location: string | null;
  assessment_type: string | null;
  status: string;
  priority: string | null;
  candidate_name: string;
  candidate_email: string | null;
};

export default function ClinicianBookingsPage() {
  const [bookings, setBookings] = useState<ClinicianBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/clinician/bookings");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load bookings");
        }

        setBookings(data.bookings ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  function getStatusClass(status: string) {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "NO_SHOW":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getPriorityClass(priority: string | null) {
    switch (priority) {
      case "PRIORITY":
        return "bg-orange-100 text-orange-700";
      case "STANDARD":
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <p className="text-sm text-gray-500">
          View bookings assigned to you.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Candidate</th>
              <th className="px-4 py-3 font-medium text-gray-600">Assessment</th>
              <th className="px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 font-medium text-gray-600">Time</th>
              <th className="px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No bookings assigned to you yet.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{booking.candidate_name}</div>
                    <div className="text-xs text-gray-500">
                      {booking.candidate_email || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {booking.assessment_type || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {booking.appointment_date
                      ? new Date(booking.appointment_date).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-4 py-3">
                    {booking.appointment_time || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {booking.clinic_location || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPriorityClass(
                        booking.priority
                      )}`}
                    >
                      {booking.priority || "STANDARD"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      href={`/clinician/bookings/${booking.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}