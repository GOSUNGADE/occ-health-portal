"use client";

import { useEffect, useMemo, useState } from "react";
import { uiStyles } from "@/components/ui/styles";

type Candidate = {
  id: number;
  full_name: string;
  email: string | null;
};

type Booking = {
  id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string | null;
  appointment_date: string;
  appointment_time: string | null;
  assessment_type: string | null;
  clinic_location: string | null;
  assigned_clinician: string | null;
  priority: string | null;
  status: string;
  notes: string | null;
  consent_completed: boolean;
  questionnaire_completed: boolean;
};

type StatusFilter =
  | "ALL"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

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

function getStatusStyle(status: string) {
  switch (status) {
    case "SCHEDULED":
      return uiStyles.statusBlue;
    case "IN_PROGRESS":
      return uiStyles.statusYellow;
    case "COMPLETED":
      return uiStyles.statusGreen;
    case "CANCELLED":
      return uiStyles.statusRed;
    case "NO_SHOW":
      return uiStyles.statusGray;
    default:
      return uiStyles.statusGray;
  }
}

function getCompletionBadge(completed: boolean) {
  return completed
    ? {
        label: "Completed",
        style: uiStyles.statusGreen,
      }
    : {
        label: "Pending",
        style: uiStyles.statusGray,
      };
}

export default function EmployerBookingsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [assignedClinician, setAssignedClinician] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [notes, setNotes] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  async function fetchData() {
    const c = await fetch("/api/candidate");
    const b = await fetch("/api/bookings");

    const cData = await c.json();
    const bData = await b.json();

    setCandidates(cData.candidates || []);
    setBookings(bData.bookings || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: Number(selectedCandidateId),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        assessment_type: assessmentType,
        clinic_location: clinicLocation,
        assigned_clinician: assignedClinician,
        priority,
        notes,
      }),
    });

    setShowCreateModal(false);
    setSelectedCandidateId("");
    setAppointmentDate("");
    setAppointmentTime("");
    setAssessmentType("");
    setClinicLocation("");
    setAssignedClinician("");
    setPriority("STANDARD");
    setNotes("");

    fetchData();
  }

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  return (
    <div style={uiStyles.page}>
      <div style={uiStyles.headerRow}>
        <div>
          <h1 style={uiStyles.title}>Bookings</h1>
          <p style={uiStyles.subtitle}>Manage all candidate bookings</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={uiStyles.primaryActionButton}
        >
          + Create Booking
        </button>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        style={uiStyles.input}
      >
        <option value="ALL">All</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="NO_SHOW">No Show</option>
      </select>

      <section style={uiStyles.panel}>
        <div style={uiStyles.tableWrap}>
          <div
            style={{
              ...uiStyles.tableHeader,
              gridTemplateColumns:
                "2fr 1.25fr 1fr 1fr 1.25fr 1.25fr 1fr 1fr 1fr 1.2fr",
            }}
          >
            <div>Candidate</div>
            <div>Assessment</div>
            <div>Date</div>
            <div>Time</div>
            <div>Clinic</div>
            <div>Clinician</div>
            <div>Consent</div>
            <div>Questionnaire</div>
            <div>Priority</div>
            <div>Status</div>
          </div>

          {filteredBookings.map((b) => {
            const consentBadge = getCompletionBadge(b.consent_completed);
            const questionnaireBadge = getCompletionBadge(
              b.questionnaire_completed
            );

            return (
              <div
                key={b.id}
                style={{
                  ...uiStyles.tableRow,
                  gridTemplateColumns:
                    "2fr 1.25fr 1fr 1fr 1.25fr 1.25fr 1fr 1fr 1fr 1.2fr",
                }}
              >
                <div>
                  <div style={uiStyles.rowTitle}>{b.candidate_name}</div>
                  <div style={uiStyles.rowSub}>{b.candidate_email}</div>
                </div>

                <div style={uiStyles.cellMuted}>
                  {b.assessment_type || "-"}
                </div>

                <div style={uiStyles.cellMuted}>
                  {new Date(b.appointment_date).toLocaleDateString()}
                </div>

                <div style={uiStyles.cellMuted}>
                  {b.appointment_time || "-"}
                </div>

                <div style={uiStyles.cellMuted}>
                  {b.clinic_location || "-"}
                </div>

                <div style={uiStyles.cellMuted}>
                  {b.assigned_clinician || "-"}
                </div>

                <div>
                  <span
                    style={{
                      ...uiStyles.statusBadge,
                      ...consentBadge.style,
                    }}
                  >
                    {consentBadge.label}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      ...uiStyles.statusBadge,
                      ...questionnaireBadge.style,
                    }}
                  >
                    {questionnaireBadge.label}
                  </span>
                </div>

                <div style={uiStyles.cellMuted}>
                  {b.priority || "-"}
                </div>

                <div>
                  <span
                    style={{
                      ...uiStyles.statusBadge,
                      ...getStatusStyle(b.status),
                    }}
                  >
                    {formatStatusLabel(b.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showCreateModal && (
        <div style={uiStyles.modalBackdrop}>
          <form onSubmit={handleCreateBooking} style={uiStyles.modalCard}>
            <div style={uiStyles.modalHeader}>
              <div>
                <h2 style={uiStyles.modalTitle}>Create Booking</h2>
                <p style={uiStyles.modalSubtitle}>
                  Create a new booking for a candidate
                </p>
              </div>
            </div>

            <div style={uiStyles.form}>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                style={uiStyles.input}
                required
              >
                <option value="">Select candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Assessment Type"
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                style={uiStyles.input}
              />

              <div style={uiStyles.formGrid}>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  style={uiStyles.input}
                  required
                />
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  style={uiStyles.input}
                />
              </div>

              <input
                placeholder="Clinic"
                value={clinicLocation}
                onChange={(e) => setClinicLocation(e.target.value)}
                style={uiStyles.input}
              />

              <input
                placeholder="Clinician"
                value={assignedClinician}
                onChange={(e) => setAssignedClinician(e.target.value)}
                style={uiStyles.input}
              />

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={uiStyles.input}
              >
                <option value="STANDARD">Standard</option>
                <option value="PRIORITY">Priority</option>
              </select>

              <textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={uiStyles.textarea}
              />

              <div style={uiStyles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={uiStyles.secondaryActionButton}
                >
                  Cancel
                </button>

                <button style={uiStyles.primaryActionButton}>
                  Create
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
