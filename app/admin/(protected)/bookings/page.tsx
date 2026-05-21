"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: number;
  candidate_id: number;
  employer_id: number;
  appointment_date: string;
  appointment_time: string | null;
  assessment_type: string | null;
  clinic_location: string | null;
  status: string;
  priority: string | null;
  assigned_clinician_id: number | null;
  candidate_name?: string;
  candidate_email?: string;
  updated_at?: string;
};

type Clinician = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedClinicians, setSelectedClinicians] = useState<
    Record<number, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [assigningBookingId, setAssigningBookingId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const [bookingsRes, cliniciansRes] = await Promise.all([
        fetch("/api/admin/bookings", { cache: "no-store" }),
        fetch("/api/admin/clinicians", { cache: "no-store" }),
      ]);

      const bookingsData = await bookingsRes.json();
      const cliniciansData = await cliniciansRes.json();

      if (!bookingsRes.ok) {
        setError(bookingsData.error || "Failed to load bookings.");
        return;
      }

      if (!cliniciansRes.ok) {
        setError(cliniciansData.error || "Failed to load clinicians.");
        return;
      }

      const fetchedBookings: Booking[] = bookingsData.bookings || [];
      const fetchedClinicians: Clinician[] = cliniciansData.clinicians || [];

      setBookings(fetchedBookings);
      setClinicians(fetchedClinicians);

      const initialSelections: Record<number, string> = {};
      for (const booking of fetchedBookings) {
        initialSelections[booking.id] = booking.assigned_clinician_id
          ? String(booking.assigned_clinician_id)
          : "";
      }
      setSelectedClinicians(initialSelections);
    } catch (error) {
      console.error(error);
      setError("Something went wrong while loading bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(bookingId: number) {
    const clinicianId = selectedClinicians[bookingId];

    setError("");
    setSuccessMessage("");

    if (!clinicianId) {
      setError("Please select a clinician first.");
      return;
    }

    try {
      setAssigningBookingId(bookingId);

      const res = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigned_clinician_id: Number(clinicianId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to assign clinician.");
        return;
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                assigned_clinician_id: Number(clinicianId),
                updated_at: data.booking?.updated_at ?? booking.updated_at,
              }
            : booking
        )
      );

      setSuccessMessage("Clinician assigned successfully.");
    } catch (error) {
      console.error(error);
      setError("Something went wrong while assigning clinician.");
    } finally {
      setAssigningBookingId(null);
    }
  }

  function getAssignedClinicianName(assignedClinicianId: number | null) {
    if (!assignedClinicianId) return "Unassigned";

    const clinician = clinicians.find((c) => c.id === assignedClinicianId);
    return clinician ? clinician.full_name : "Unknown clinician";
  }

  const activeClinicians = clinicians.filter((c) => c.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
        <p className="mt-1 text-sm text-slate-600">
          View bookings and assign clinicians.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-5 text-sm text-slate-600">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="p-3 font-medium text-slate-700">Candidate</th>
                  <th className="p-3 font-medium text-slate-700">Date</th>
                  <th className="p-3 font-medium text-slate-700">Time</th>
                  <th className="p-3 font-medium text-slate-700">Assessment</th>
                  <th className="p-3 font-medium text-slate-700">Location</th>
                  <th className="p-3 font-medium text-slate-700">Status</th>
                  <th className="p-3 font-medium text-slate-700">Priority</th>
                  <th className="p-3 font-medium text-slate-700">
                    Current Clinician
                  </th>
                  <th className="p-3 font-medium text-slate-700">
                    Select Clinician
                  </th>
                  <th className="p-3 font-medium text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium text-slate-900">
                        {booking.candidate_name ||
                          `Candidate #${booking.candidate_id}`}
                      </div>
                      {booking.candidate_email ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {booking.candidate_email}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-3 text-slate-700">
                      {booking.appointment_date
                        ? new Date(booking.appointment_date).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-3 text-slate-700">
                      {booking.appointment_time || "-"}
                    </td>

                    <td className="p-3 text-slate-700">
                      {booking.assessment_type || "-"}
                    </td>

                    <td className="p-3 text-slate-700">
                      {booking.clinic_location || "-"}
                    </td>

                    <td className="p-3 text-slate-700">{booking.status}</td>

                    <td className="p-3 text-slate-700">
                      {booking.priority || "STANDARD"}
                    </td>

                    <td className="p-3 text-slate-700">
                      {getAssignedClinicianName(booking.assigned_clinician_id)}
                    </td>

                    <td className="p-3">
                      <select
                        className="w-full min-w-[220px] rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                        value={selectedClinicians[booking.id] || ""}
                        onChange={(e) =>
                          setSelectedClinicians((prev) => ({
                            ...prev,
                            [booking.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select clinician</option>
                        {activeClinicians.map((clinician) => (
                          <option key={clinician.id} value={clinician.id}>
                            {clinician.full_name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleAssign(booking.id)}
                        disabled={assigningBookingId === booking.id}
                        className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {assigningBookingId === booking.id
                          ? "Saving..."
                          : "Assign"}
                      </button>
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