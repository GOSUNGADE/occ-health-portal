"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: string;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string;
  assessment_type: string | null;
  clinic_location: string | null;
  created_at: string;
};

export default function CandidateBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/candidate/bookings");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load bookings.");
          return;
        }

        setBookings(data.bookings || []);
      } catch (error) {
        console.error(error);
        setError("Something went wrong while loading bookings.");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  function formatDate(dateValue: string | null) {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString();
  }

  function getStatusBadgeClass(status: string) {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Your Bookings</h1>
        <p className="mt-2 text-sm text-gray-600">
          View your scheduled appointments and current booking status.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-gray-50 px-6 py-10 text-center">
            <h2 className="text-base font-semibold text-gray-900">
              No bookings yet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your upcoming appointments will appear here once a booking is
              created for you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-700">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assessment Type</th>
                  <th className="px-4 py-3 font-semibold">Clinic Location</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b text-gray-700 transition hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/candidate/bookings/${booking.id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(booking.appointment_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {booking.appointment_time || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {booking.assessment_type || "N/A"}
                    </td>
                    <td className="px-4 py-4">
                      {booking.clinic_location || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}