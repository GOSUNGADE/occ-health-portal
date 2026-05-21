"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Booking = {
  id: number;
  appointment_date: string;
  appointment_time: string | null;
  status: string;
  notes: string | null;
  assessment_type: string | null;
  clinic_location: string | null;
  assigned_clinician: string | null;
  priority: string | null;
};

type Consent = {
  id: number;
  booking_id: number;
  candidate_id: number;
  consent_given: boolean;
  full_name: string;
  signed_at: string;
  created_at: string;
  updated_at: string;
};

type Questionnaire = {
  id: number;
  booking_id: number;
  candidate_id: number;
  medical_history: string | null;
  current_symptoms: string | null;
  medications: string | null;
  allergies: string | null;
  submitted: boolean;
  created_at: string;
  updated_at: string;
};

export default function CandidateBookingDetailPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);

  const [loading, setLoading] = useState(true);
  const [consentLoading, setConsentLoading] = useState(true);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(true);

  const [submittingConsent, setSubmittingConsent] = useState(false);
  const [submittingQuestionnaire, setSubmittingQuestionnaire] = useState(false);

  const [error, setError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [consentSuccess, setConsentSuccess] = useState("");
  const [questionnaireError, setQuestionnaireError] = useState("");
  const [questionnaireSuccess, setQuestionnaireSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const [medicalHistory, setMedicalHistory] = useState("");
  const [currentSymptoms, setCurrentSymptoms] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    const loadBooking = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/candidate/bookings/${bookingId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load booking");
        }

        setBooking(data.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };

    const loadConsent = async () => {
      try {
        setConsentLoading(true);
        setConsentError("");

        const response = await fetch(`/api/candidate/bookings/${bookingId}/consent`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load consent");
        }

        setConsent(data.consent ?? null);
      } catch (err) {
        setConsentError(err instanceof Error ? err.message : "Failed to load consent");
      } finally {
        setConsentLoading(false);
      }
    };

    const loadQuestionnaire = async () => {
      try {
        setQuestionnaireLoading(true);
        setQuestionnaireError("");

        const response = await fetch(`/api/candidate/bookings/${bookingId}/questionnaire`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load questionnaire");
        }

        setQuestionnaire(data.questionnaire ?? null);
      } catch (err) {
        setQuestionnaireError(
          err instanceof Error ? err.message : "Failed to load questionnaire"
        );
      } finally {
        setQuestionnaireLoading(false);
      }
    };

    loadBooking();
    loadConsent();
    loadQuestionnaire();
  }, [bookingId]);

  async function handleConsentSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmittingConsent(true);
      setConsentError("");
      setConsentSuccess("");

      const response = await fetch(`/api/candidate/bookings/${bookingId}/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          consentGiven,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit consent");
      }

      setConsent(data.consent);
      setConsentSuccess("Consent submitted successfully.");
      setFullName("");
      setConsentGiven(false);
    } catch (err) {
      setConsentError(err instanceof Error ? err.message : "Failed to submit consent");
    } finally {
      setSubmittingConsent(false);
    }
  }

  async function handleQuestionnaireSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmittingQuestionnaire(true);
      setQuestionnaireError("");
      setQuestionnaireSuccess("");

      const response = await fetch(
        `/api/candidate/bookings/${bookingId}/questionnaire`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicalHistory,
            currentSymptoms,
            medications,
            allergies,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit questionnaire");
      }

      setQuestionnaire(data.questionnaire);
      setQuestionnaireSuccess("Questionnaire submitted successfully.");
      setMedicalHistory("");
      setCurrentSymptoms("");
      setMedications("");
      setAllergies("");
    } catch (err) {
      setQuestionnaireError(
        err instanceof Error ? err.message : "Failed to submit questionnaire"
      );
    } finally {
      setSubmittingQuestionnaire(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading booking...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!booking) {
    return <div className="p-6">Booking not found.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Booking Details</h1>
        <p className="text-sm text-gray-500">
          Review your appointment and complete required actions.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Assessment Type</p>
            <p className="font-medium">{booking.assessment_type || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{booking.status}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Appointment Date</p>
            <p className="font-medium">
              {booking.appointment_date
                ? new Date(booking.appointment_date).toLocaleDateString()
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Appointment Time</p>
            <p className="font-medium">{booking.appointment_time || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Clinic Location</p>
            <p className="font-medium">{booking.clinic_location || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Assigned Clinician</p>
            <p className="font-medium">{booking.assigned_clinician || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Priority</p>
            <p className="font-medium">{booking.priority || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Notes</p>
            <p className="font-medium">{booking.notes || "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Consent</h2>
          <p className="text-sm text-gray-500">
            Please review and complete your consent for this booking.
          </p>
        </div>

        {consentLoading ? (
          <p>Loading consent...</p>
        ) : consent ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-medium text-green-700">Consent completed</p>
              <p className="text-sm text-gray-700">
                Signed by <strong>{consent.full_name}</strong>
              </p>
              <p className="text-sm text-gray-700">
                Signed at {new Date(consent.signed_at).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConsentSubmit} className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">
              I confirm that I understand the purpose of this appointment and
              consent to proceed with the assessment and related administrative
              handling required for this booking.
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Enter your full name"
                disabled={submittingConsent}
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                disabled={submittingConsent}
                className="mt-1"
              />
              <span>
                I have read the consent statement above and I agree to proceed.
              </span>
            </label>

            {consentError && (
              <p className="text-sm text-red-600">{consentError}</p>
            )}

            {consentSuccess && (
              <p className="text-sm text-green-600">{consentSuccess}</p>
            )}

            <button
              type="submit"
              disabled={submittingConsent}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {submittingConsent ? "Submitting..." : "Submit Consent"}
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Questionnaire</h2>
          <p className="text-sm text-gray-500">
            Please complete your questionnaire before the appointment.
          </p>
        </div>

        {questionnaireLoading ? (
          <p>Loading questionnaire...</p>
        ) : questionnaire?.submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-medium text-green-700">
                Questionnaire completed
              </p>
              <p className="text-sm text-gray-700">
                Submitted at {new Date(questionnaire.updated_at).toLocaleString()}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Medical History</p>
                <p className="font-medium whitespace-pre-wrap">
                  {questionnaire.medical_history || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Current Symptoms</p>
                <p className="font-medium whitespace-pre-wrap">
                  {questionnaire.current_symptoms || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Medications</p>
                <p className="font-medium whitespace-pre-wrap">
                  {questionnaire.medications || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Allergies</p>
                <p className="font-medium whitespace-pre-wrap">
                  {questionnaire.allergies || "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleQuestionnaireSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Medical History
              </label>
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border px-3 py-2"
                placeholder="Enter any relevant medical history"
                disabled={submittingQuestionnaire}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Current Symptoms
              </label>
              <textarea
                value={currentSymptoms}
                onChange={(e) => setCurrentSymptoms(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border px-3 py-2"
                placeholder="Describe your current symptoms"
                disabled={submittingQuestionnaire}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Medications
              </label>
              <textarea
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border px-3 py-2"
                placeholder="List any medications you are taking"
                disabled={submittingQuestionnaire}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Allergies
              </label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border px-3 py-2"
                placeholder="List any allergies"
                disabled={submittingQuestionnaire}
              />
            </div>

            {questionnaireError && (
              <p className="text-sm text-red-600">{questionnaireError}</p>
            )}

            {questionnaireSuccess && (
              <p className="text-sm text-green-600">{questionnaireSuccess}</p>
            )}

            <button
              type="submit"
              disabled={submittingQuestionnaire}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {submittingQuestionnaire ? "Submitting..." : "Submit Questionnaire"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}