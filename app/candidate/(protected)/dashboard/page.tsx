"use client";

import { useEffect, useState } from "react";

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
};

type Booking = {
  id: string;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string;
  assessment_type: string | null;
  clinic_location: string | null;
  created_at: string;
};

export default function CandidateDashboardPage() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [candidateRes, bookingsRes] = await Promise.all([
          fetch("/api/candidate/me"),
          fetch("/api/candidate/bookings"),
        ]);

        const candidateData = await candidateRes.json();
        const bookingsData = await bookingsRes.json();

        if (!candidateRes.ok) {
          setError(candidateData.error || "Failed to load candidate details");
          return;
        }

        if (!bookingsRes.ok) {
          setError(bookingsData.error || "Failed to load bookings");
          return;
        }

        setCandidate(candidateData.candidate);
        setBookings(bookingsData.bookings || []);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading your dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  function formatDate(dateValue: string | null) {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString();
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Loading dashboard...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Candidate record not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {candidate.full_name}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          This is your candidate portal.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Your Details</h2>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>
            <strong>Email:</strong> {candidate.email}
          </p>
          <p>
            <strong>Phone:</strong> {candidate.phone || "Not provided"}
          </p>
          <p>
            <strong>Date of Birth:</strong>{" "}
            {candidate.date_of_birth
              ? formatDate(candidate.date_of_birth)
              : "Not provided"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Your Bookings</h2>

        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No bookings yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border px-4 py-3 text-sm text-gray-700"
              >
                <p>
                  <strong>Date:</strong> {formatDate(booking.appointment_date)}
                </p>
                <p>
                  <strong>Time:</strong> {booking.appointment_time || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong> {booking.status}
                </p>
                <p>
                  <strong>Assessment Type:</strong>{" "}
                  {booking.assessment_type || "N/A"}
                </p>
                <p>
                  <strong>Clinic Location:</strong>{" "}
                  {booking.clinic_location || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}