"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { uiStyles } from "@/components/ui/styles";

type Candidate = {
  id: number;
  full_name: string;
  email: string | null;
};

type AssessmentTest = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  requires_fasting: boolean;
  requires_referral: boolean;
};

type AssessmentType = {
  id: number;
  name: string;
  description: string | null;
  industry: string;
  duration_minutes: number | null;
  tests: AssessmentTest[];
};

type Booking = {
  id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string | null;
  appointment_date: string;
  appointment_time: string | null;
  assessment_type: string | null;
  assessment_type_id: number | null;
  assessment_type_name: string | null;
  assessment_industry: string | null;
  clinic_location: string | null;
  preferred_clinician: string | null;
  assigned_clinician: string | null;
  assigned_clinician_id: number | null;
  priority: string | null;
  status: string;
  notes: string | null;
  consent_completed: boolean;
  questionnaire_completed: boolean;
  can_employer_modify?: boolean;
};

type StatusFilter =
  | "ALL"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

// Steps in the booking wizard
type Step = 1 | 2 | 3;
type ModalMode = "create" | "edit";

const INDUSTRIES = [
  "All",
  "General Workforce",
  "Construction & Trades",
  "Mining & FIFO",
  "Rail",
  "Transport & Logistics",
  "Safety Critical",
  "Corporate",
];

const INDUSTRY_ICONS: Record<string, string> = {
  "General Workforce": "🏢",
  "Construction & Trades": "🏗️",
  "Mining & FIFO": "⛏️",
  Rail: "🚂",
  "Transport & Logistics": "🚛",
  "Safety Critical": "⚠️",
  Corporate: "👔",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
    default:
      return uiStyles.statusGray;
  }
}

function badge(completed: boolean) {
  return completed ? uiStyles.statusGreen : uiStyles.statusGray;
}

// ── Assessment Card ──────────────────────────────────────────
function AssessmentCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: AssessmentType;
  selected: boolean;
  onSelect: () => void;
}) {
  const requiresFasting = pkg.tests.some((t) => t.requires_fasting);

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        border: selected ? "2px solid #119ee8" : "1.5px solid #e2e8f0",
        borderRadius: "16px",
        padding: "16px",
        background: selected ? "#eff8ff" : "#fff",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
      }}
    >
      {/* Selected tick */}
      {selected && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#119ee8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          ✓
        </div>
      )}

      <p
        style={{
          margin: "0 0 6px",
          fontSize: "15px",
          fontWeight: 700,
          color: "#0f172a",
          paddingRight: "28px",
        }}
      >
        {pkg.name}
      </p>

      {pkg.description && (
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "13px",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {pkg.description}
        </p>
      )}

      {/* Tests list */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "10px",
        }}
      >
        {pkg.tests.map((t) => (
          <span
            key={t.id}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "999px",
              padding: "3px 10px",
              fontSize: "12px",
              color: "#475569",
              fontWeight: 500,
            }}
          >
            {t.name}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {pkg.duration_minutes && (
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            ⏱ {pkg.duration_minutes} min
          </span>
        )}
        {requiresFasting && (
          <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>
            ⚠️ Fasting required
          </span>
        )}
      </div>
    </button>
  );
}

// ── Step Indicator ───────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Select Candidate" },
    { n: 2, label: "Choose Assessment" },
    { n: 3, label: "Booking Details" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0",
        marginBottom: "24px",
      }}
    >
      {steps.map((s, i) => (
        <div
          key={s.n}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < steps.length - 1 ? 1 : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: step >= s.n ? "#119ee8" : "#e2e8f0",
                color: step >= s.n ? "#fff" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {step > s.n ? "✓" : s.n}
            </div>
            <span
              style={{
                fontSize: "11px",
                color: step >= s.n ? "#119ee8" : "#94a3b8",
                marginTop: "4px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: "2px",
                background: step > s.n ? "#119ee8" : "#e2e8f0",
                margin: "0 8px",
                marginBottom: "18px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function EmployerBookingsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<
    number | null
  >(null);
  const [industryFilter, setIndustryFilter] = useState("All");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [preferredClinician, setPreferredClinician] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [notes, setNotes] = useState("");

  // Status filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [cRes, bRes, aRes] = await Promise.all([
      fetch("/api/candidate"),
      fetch("/api/bookings"),
      fetch("/api/assessment-types"),
    ]);
    const [cData, bData, aData] = await Promise.all([
      cRes.json(),
      bRes.json(),
      aRes.json(),
    ]);
    setCandidates(cData.candidates || []);
    setBookings(bData.bookings || []);
    setAssessmentTypes(aData.assessment_types || []);
    setLoading(false);
  }

  function resetForm() {
    setStep(1);
    setSelectedCandidateId("");
    setSelectedAssessmentId(null);
    setIndustryFilter("All");
    setAppointmentDate("");
    setAppointmentTime("");
    setClinicLocation("");
    setPreferredClinician("");
    setPriority("STANDARD");
    setNotes("");
    setError("");
  }

  function openCreate() {
    resetForm();
    setModalMode("create");
    setEditingBooking(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingBooking(null);
    setError("");
  }

  function canEmployerModifyBooking(b: Booking) {
    if (typeof b.can_employer_modify === "boolean")
      return b.can_employer_modify;
    return !b.assigned_clinician_id && b.status === "SCHEDULED";
  }

  function openEdit(b: Booking) {
    if (!canEmployerModifyBooking(b)) return;
    setModalMode("edit");
    setEditingBooking(b);
    setStep(3);
    setSelectedCandidateId(String(b.candidate_id));
    setSelectedAssessmentId(b.assessment_type_id);
    setIndustryFilter("All");
    setAppointmentDate(String(b.appointment_date).slice(0, 10));
    setAppointmentTime(b.appointment_time || "");
    setClinicLocation(b.clinic_location || "");
    setPreferredClinician(b.preferred_clinician || "");
    setPriority(b.priority || "STANDARD");
    setNotes(b.notes || "");
    setError("");
    setOpenMenuId(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const url =
        modalMode === "edit" && editingBooking
          ? `/api/bookings/${editingBooking.id}`
          : "/api/bookings";
      const method = modalMode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: Number(selectedCandidateId),
          assessment_type_id: selectedAssessmentId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime || null,
          clinic_location: clinicLocation || null,
          preferred_clinician: preferredClinician || null,
          priority,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save booking.");
        return;
      }
      closeModal();
      fetchData();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking(b: Booking) {
    if (!canEmployerModifyBooking(b)) {
      alert(
        "This booking has already been assigned or is no longer editable. Please contact the clinic.",
      );
      return;
    }

    const ok = confirm(
      "Cancel this booking? This will remove it from active clinic scheduling.",
    );
    if (!ok) return;

    const res = await fetch(`/api/bookings/${b.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancellation_reason: "Cancelled by employer" }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to cancel booking.");
      return;
    }

    setOpenMenuId(null);
    fetchData();
  }

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, id: number) {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setOpenMenuId(id);
  }

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const filteredAssessments = useMemo(() => {
    if (industryFilter === "All") return assessmentTypes;
    return assessmentTypes.filter((a) => a.industry === industryFilter);
  }, [assessmentTypes, industryFilter]);

  const selectedAssessment = assessmentTypes.find(
    (a) => a.id === selectedAssessmentId,
  );
  const selectedCandidate = candidates.find(
    (c) => c.id === Number(selectedCandidateId),
  );

  const openMenuBooking =
    openMenuId !== null ? bookings.find((b) => b.id === openMenuId) : null;

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    border: active ? "1.5px solid #119ee8" : "1.5px solid #e2e8f0",
    background: active ? "#eff8ff" : "#fff",
    color: active ? "#119ee8" : "#64748b",
    borderRadius: "999px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div style={uiStyles.page}>
      {/* Header */}
      <div style={uiStyles.headerRow}>
        <div>
          <h1 style={uiStyles.title}>Bookings</h1>
          <p style={uiStyles.subtitle}>
            Manage all candidate health assessments
          </p>
        </div>
        <button onClick={openCreate} style={uiStyles.primaryActionButton}>
          + Create Booking
        </button>
      </div>

      {/* Status filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {(
          [
            "ALL",
            "SCHEDULED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
            "NO_SHOW",
          ] as StatusFilter[]
        ).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            style={filterBtnStyle(statusFilter === s)}
          >
            {s === "ALL" ? `All (${bookings.length})` : formatStatus(s)}
          </button>
        ))}
      </div>

      {/* Bookings table */}
      <section style={uiStyles.panel}>
        {loading ? (
          <div style={{ padding: "24px", color: "#64748b", fontSize: "14px" }}>
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={uiStyles.emptyState}>
            <div style={uiStyles.emptyIcon}>🗓</div>
            <p style={uiStyles.emptyTitle}>No bookings yet</p>
            <p style={uiStyles.emptyText}>
              Create your first booking to get started.
            </p>
            <button onClick={openCreate} style={uiStyles.emptyButton}>
              + Create Booking
            </button>
          </div>
        ) : (
          <div style={uiStyles.tableWrap}>
            <div
              style={{
                ...uiStyles.tableHeader,
                gridTemplateColumns:
                  "2fr 2fr 1fr 1fr 1.5fr 0.8fr 0.8fr 1.1fr 0.8fr 0.7fr",
              }}
            >
              <div>Candidate</div>
              <div>Assessment</div>
              <div>Date</div>
              <div>Time</div>
              <div>Clinic</div>
              <div>Consent</div>
              <div>Questionnaire</div>
              <div>Priority</div>
              <div>Status</div>
              <div>Action</div>
            </div>
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  ...uiStyles.tableRow,
                  gridTemplateColumns:
                    "2fr 2fr 1fr 1fr 1.5fr 0.8fr 0.8fr 1.1fr 0.8fr 0.7fr",
                }}
              >
                <div>
                  <div style={uiStyles.rowTitle}>{b.candidate_name}</div>
                  <div style={uiStyles.rowSub}>{b.candidate_email}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {b.assessment_type_name || b.assessment_type || "—"}
                  </div>
                  {b.assessment_industry && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        marginTop: "2px",
                      }}
                    >
                      {INDUSTRY_ICONS[b.assessment_industry] || ""}{" "}
                      {b.assessment_industry}
                    </div>
                  )}
                </div>
                <div style={uiStyles.cellMuted}>
                  {new Date(b.appointment_date).toLocaleDateString()}
                </div>
                <div style={uiStyles.cellMuted}>
                  {b.appointment_time || "—"}
                </div>
                <div style={uiStyles.cellMuted}>{b.clinic_location || "—"}</div>
                <div>
                  <span
                    style={{
                      ...uiStyles.statusBadge,
                      ...badge(b.consent_completed),
                    }}
                  >
                    {b.consent_completed ? "Done" : "Pending"}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      ...uiStyles.statusBadge,
                      ...badge(b.questionnaire_completed),
                    }}
                  >
                    {b.questionnaire_completed ? "Done" : "Pending"}
                  </span>
                </div>
                <div style={uiStyles.cellMuted}>{b.priority || "—"}</div>
                <div>
                  <span
                    style={{
                      ...uiStyles.statusBadge,
                      ...getStatusStyle(b.status),
                    }}
                  >
                    {formatStatus(b.status)}
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={(e) => openMenu(e, b.id)}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      borderRadius: "10px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#475569",
                    }}
                    aria-label="Booking actions"
                  >
                    ⋯
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action menu portal */}
      {openMenuBooking &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: menuPos.top,
              right: menuPos.right,
              zIndex: 9999,
              minWidth: "190px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(15,23,42,0.15)",
              overflow: "hidden",
            }}
          >
            {canEmployerModifyBooking(openMenuBooking) ? (
              <>
                <button
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    border: "none",
                    background: "#fff",
                    padding: "11px 16px",
                    fontSize: 14,
                    cursor: "pointer",
                    color: "#0f172a",
                    textAlign: "left",
                  }}
                  onClick={() => openEdit(openMenuBooking)}
                >
                  ✏️ Edit booking
                </button>
                <button
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    border: "none",
                    background: "#fff",
                    padding: "11px 16px",
                    fontSize: 14,
                    cursor: "pointer",
                    color: "#dc2626",
                    textAlign: "left",
                  }}
                  onClick={() => cancelBooking(openMenuBooking)}
                >
                  ❌ Cancel booking
                </button>
              </>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.45,
                }}
              >
                Locked after clinic assignment. Contact the clinic to change
                this booking.
              </div>
            )}
          </div>,
          document.body,
        )}

      {/* ── Create Booking Modal ── */}
      {showModal && (
        <div style={uiStyles.modalBackdrop}>
          <div
            style={{
              ...uiStyles.modalCard,
              maxWidth: "760px",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <div style={uiStyles.modalHeader}>
              <div>
                <h2 style={uiStyles.modalTitle}>
                  {modalMode === "edit" ? "Edit Booking" : "Create Booking"}
                </h2>
                <p style={uiStyles.modalSubtitle}>
                  {modalMode === "edit"
                    ? "You can edit this booking until the clinic assigns a clinician"
                    : "Follow the steps to create a new health assessment booking"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={uiStyles.closeBtn}
              >
                ✕
              </button>
            </div>

            <StepIndicator step={step} />

            {error && (
              <div style={{ ...uiStyles.alertError, marginBottom: "16px" }}>
                {error}
              </div>
            )}

            {/* ── Step 1: Select Candidate ── */}
            {step === 1 && (
              <div>
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  Who is this booking for?
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "320px",
                    overflowY: "auto",
                  }}
                >
                  {candidates.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "14px" }}>
                      No candidates yet. Add candidates first.
                    </p>
                  ) : (
                    candidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCandidateId(String(c.id))}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          border:
                            selectedCandidateId === String(c.id)
                              ? "2px solid #119ee8"
                              : "1.5px solid #e2e8f0",
                          background:
                            selectedCandidateId === String(c.id)
                              ? "#eff8ff"
                              : "#fff",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background:
                              selectedCandidateId === String(c.id)
                                ? "#119ee8"
                                : "#e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: 700,
                            color:
                              selectedCandidateId === String(c.id)
                                ? "#fff"
                                : "#475569",
                            flexShrink: 0,
                          }}
                        >
                          {c.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {c.full_name}
                          </p>
                          {c.email && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              {c.email}
                            </p>
                          )}
                        </div>
                        {selectedCandidateId === String(c.id) && (
                          <span
                            style={{
                              marginLeft: "auto",
                              color: "#119ee8",
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div style={{ ...uiStyles.modalActions, marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={uiStyles.secondaryActionButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCandidateId}
                    onClick={() => setStep(2)}
                    style={{
                      ...uiStyles.primaryActionButton,
                      opacity: selectedCandidateId ? 1 : 0.5,
                    }}
                  >
                    Next: Choose Assessment →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Select Assessment ── */}
            {step === 2 && (
              <div>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  What type of assessment does {selectedCandidate?.full_name}{" "}
                  need?
                </p>

                {/* Industry filter */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                  }}
                >
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustryFilter(ind)}
                      style={filterBtnStyle(industryFilter === ind)}
                    >
                      {ind !== "All" && INDUSTRY_ICONS[ind]} {ind}
                    </button>
                  ))}
                </div>

                {/* Assessment cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "12px",
                    maxHeight: "380px",
                    overflowY: "auto",
                    paddingRight: "4px",
                  }}
                >
                  {filteredAssessments.map((pkg) => (
                    <AssessmentCard
                      key={pkg.id}
                      pkg={pkg}
                      selected={selectedAssessmentId === pkg.id}
                      onSelect={() =>
                        setSelectedAssessmentId(
                          pkg.id === selectedAssessmentId ? null : pkg.id,
                        )
                      }
                    />
                  ))}
                </div>

                {/* Selected summary */}
                {selectedAssessment && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      background: "#eff8ff",
                      borderRadius: "12px",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#1d4ed8",
                      }}
                    >
                      Selected: {selectedAssessment.name}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#3b82f6",
                      }}
                    >
                      {selectedAssessment.tests.map((t) => t.name).join(" · ")}
                    </p>
                    {selectedAssessment.tests.some(
                      (t) => t.requires_fasting,
                    ) && (
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "12px",
                          color: "#f59e0b",
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ Candidate must fast before this assessment
                      </p>
                    )}
                  </div>
                )}

                <div style={{ ...uiStyles.modalActions, marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={uiStyles.secondaryActionButton}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedAssessmentId}
                    onClick={() => setStep(3)}
                    style={{
                      ...uiStyles.primaryActionButton,
                      opacity: selectedAssessmentId ? 1 : 0.5,
                    }}
                  >
                    Next: Booking Details →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Booking Details ── */}
            {step === 3 && (
              <form onSubmit={handleSubmit}>
                {/* Summary banner */}
                <div
                  style={{
                    padding: "14px 16px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Candidate
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {selectedCandidate?.full_name}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Assessment
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {selectedAssessment?.name}
                      </p>
                    </div>
                    {selectedAssessment?.duration_minutes && (
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Duration
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {selectedAssessment.duration_minutes} min
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={uiStyles.form}>
                  <div style={uiStyles.formGrid}>
                    <div style={uiStyles.formGroup}>
                      <label style={uiStyles.label}>Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        style={uiStyles.input}
                      />
                    </div>
                    <div style={uiStyles.formGroup}>
                      <label style={uiStyles.label}>Appointment Time</label>
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        style={uiStyles.input}
                      />
                    </div>
                  </div>

                  <div style={uiStyles.formGroup}>
                    <label style={uiStyles.label}>Clinic Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Primo Medical Perth CBD"
                      value={clinicLocation}
                      onChange={(e) => setClinicLocation(e.target.value)}
                      style={uiStyles.input}
                    />
                  </div>

                  <div style={uiStyles.formGroup}>
                    <label style={uiStyles.label}>
                      Preferred Clinician / Special Request
                    </label>
                    <input
                      type="text"
                      placeholder="Optional — clinic will confirm final clinician"
                      value={preferredClinician}
                      onChange={(e) => setPreferredClinician(e.target.value)}
                      style={uiStyles.input}
                    />
                  </div>

                  <div style={uiStyles.formGroup}>
                    <label style={uiStyles.label}>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      style={uiStyles.input}
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="PRIORITY">Priority</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div style={uiStyles.formGroup}>
                    <label style={uiStyles.label}>Notes</label>
                    <textarea
                      placeholder="Any additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={uiStyles.textarea}
                    />
                  </div>

                  {/* Fasting warning */}
                  {selectedAssessment?.tests.some(
                    (t) => t.requires_fasting,
                  ) && (
                    <div
                      style={{
                        padding: "12px 14px",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "12px",
                        fontSize: "13px",
                        color: "#92400e",
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Reminder: This assessment requires fasting. Please
                      inform the candidate not to eat or drink (except water)
                      for at least 8 hours before their appointment.
                    </div>
                  )}

                  <div style={uiStyles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      style={uiStyles.secondaryActionButton}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={uiStyles.primaryActionButton}
                    >
                      {submitting
                        ? "Saving..."
                        : modalMode === "edit"
                          ? "Save Changes"
                          : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
