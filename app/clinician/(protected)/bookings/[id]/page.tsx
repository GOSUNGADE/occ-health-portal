"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ClinicianBookingDetail = {
  id: number;
  appointment_date: string;
  appointment_time: string | null;
  status: string;
  clinic_location: string | null;
  assessment_type: string | null;
  notes: string | null;
  priority: string | null;

  candidate_id: number;
  candidate_name: string;
  candidate_email: string | null;
  phone: string | null;
  date_of_birth: string | null;

  consent_id: number | null;
  consent_given: boolean | null;
  consent_name: string | null;
  signed_at: string | null;

  questionnaire_id: number | null;
  medical_history: string | null;
  current_symptoms: string | null;
  medications: string | null;
  allergies: string | null;
  submitted: boolean | null;
};

export default function ClinicianBookingDetailPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<ClinicianBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/clinician/bookings/${bookingId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load booking");
        }

        setBooking(data.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId]);

  function formatStatus(status: string | null) {
    if (!status) return "—";

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

  function formatDate(dateString: string | null) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  }

  function getStatusBadgeClass(status: string | null) {
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

  async function updateStatus(status: string) {
    try {
      setUpdating(true);

      const res = await fetch(`/api/clinician/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.booking.status,
        };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!booking) return <div className="p-6">Not found</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Booking Detail</h1>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold">Booking</h2>

        <div className="space-y-2">
          <p>Date: {formatDate(booking.appointment_date)}</p>
          <p>Time: {booking.appointment_time || "—"}</p>
          <p>
            Status:{" "}
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                booking.status
              )}`}
            >
              {formatStatus(booking.status)}
            </span>
          </p>
          <p>Assessment Type: {booking.assessment_type || "—"}</p>
          <p>Priority: {booking.priority || "—"}</p>
          <p>Location: {booking.clinic_location || "—"}</p>
          <p>Notes: {booking.notes || "—"}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => updateStatus("SCHEDULED")}
            disabled={updating}
            className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
          >
            Set Scheduled
          </button>

          <button
            onClick={() => updateStatus("IN_PROGRESS")}
            disabled={updating}
            className="rounded bg-yellow-500 px-3 py-1 text-white disabled:opacity-60"
          >
            Start
          </button>

          <button
            onClick={() => updateStatus("COMPLETED")}
            disabled={updating}
            className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-60"
          >
            Complete
          </button>

          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={updating}
            className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={() => updateStatus("NO_SHOW")}
            disabled={updating}
            className="rounded bg-gray-600 px-3 py-1 text-white disabled:opacity-60"
          >
            No Show
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold">Candidate</h2>

        <div className="space-y-2">
          <p>Name: {booking.candidate_name}</p>
          <p>Email: {booking.candidate_email || "—"}</p>
          <p>Phone: {booking.phone || "—"}</p>
          <p>DOB: {formatDate(booking.date_of_birth)}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold">Consent</h2>

        {booking.consent_id ? (
          <div className="space-y-2">
            <p>Given: Yes</p>
            <p>Signed by: {booking.consent_name}</p>
            <p>Signed at: {formatDateTime(booking.signed_at)}</p>
          </div>
        ) : (
          <p className="text-gray-500">Not completed</p>
        )}
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold">Questionnaire</h2>

        {booking.questionnaire_id && booking.submitted ? (
          <div className="space-y-3">
            <p>
              <strong>Medical History:</strong>{" "}
              <span className="whitespace-pre-wrap">
                {booking.medical_history || "—"}
              </span>
            </p>
            <p>
              <strong>Symptoms:</strong>{" "}
              <span className="whitespace-pre-wrap">
                {booking.current_symptoms || "—"}
              </span>
            </p>
            <p>
              <strong>Medications:</strong>{" "}
              <span className="whitespace-pre-wrap">
                {booking.medications || "—"}
              </span>
            </p>
            <p>
              <strong>Allergies:</strong>{" "}
              <span className="whitespace-pre-wrap">
                {booking.allergies || "—"}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Not submitted</p>
        )}
      </div>
    </div>
  );
}