"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ACTIVITY_META } from "@/lib/activity-log";

type Candidate = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  notes: string | null;
  linked_user_id: number | null;
  created_at: string;
};

type Activity = {
  id: number;
  action_type: string;
  description: string;
  performed_by_name: string | null;
  performed_by_role: string | null;
  booking_id: number | null;
  assessment_type_name: string | null;
  appointment_date: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Booking = {
  id: number;
  appointment_date: string;
  appointment_time: string | null;
  assessment_type_name: string | null;
  assessment_industry: string | null;
  status: string;
  assessment_status: string | null;
  clinic_location: string | null;
  assigned_clinician: string | null;
  priority: string | null;
  total_tests: number;
  completed_tests: number;
};

type Tab = "details" | "bookings" | "activity";

function formatDateTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function roleBadge(role: string | null) {
  const map: Record<string, string> = {
    EMPLOYER: "#3b82f6", ADMIN: "#8b5cf6",
    CLINICIAN: "#06b6d4", CANDIDATE: "#10b981",
  };
  return map[role || ""] || "#94a3b8";
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = Number(params.id);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("details");
  const [error, setError] = useState("");

  useEffect(() => {
    if (candidateId) fetchAll();
  }, [candidateId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [cRes, aRes, bRes] = await Promise.all([
        fetch(`/api/candidate/${candidateId}`),
        fetch(`/api/candidate/${candidateId}/activity`),
        fetch("/api/bookings"),
      ]);

      const [cData, aData, bData] = await Promise.all([
        cRes.json(), aRes.json(), bRes.json(),
      ]);

      if (!cRes.ok) { setError(cData.error || "Failed to load candidate."); return; }

      setCandidate(cData.candidate);
      setActivities(aData.activities || []);
      setBookings((bData.bookings || []).filter((b: Booking & { candidate_id: number }) => b.candidate_id === candidateId));
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    border: "none",
    background: "transparent",
    borderBottom: active ? "2px solid #119ee8" : "2px solid transparent",
    color: active ? "#119ee8" : "#64748b",
    fontWeight: active ? 700 : 500,
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "15px" }}>
        Loading candidate...
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 16px", color: "#b91c1c", fontSize: "14px", marginBottom: "16px" }}>
          {error || "Candidate not found."}
        </div>
        <button onClick={() => router.back()} style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: "10px", padding: "10px 18px", fontSize: "14px", cursor: "pointer" }}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ color: "#0f172a" }}>
      {/* Back */}
      <button onClick={() => router.back()}
        style={{ border: "none", background: "transparent", color: "#64748b", fontSize: "14px", cursor: "pointer", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
        ← Back to Candidates
      </button>

      {/* Header card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 16px rgba(15,23,42,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "linear-gradient(135deg, #0b1220, #119ee8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {candidate.full_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
              {candidate.full_name}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
              {candidate.email || "No email"} {candidate.phone ? `· ${candidate.phone}` : ""}
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", borderRadius: "999px",
            padding: "6px 14px", fontSize: "13px", fontWeight: 700,
            background: candidate.linked_user_id ? "#ecfdf5" : "#eff6ff",
            color: candidate.linked_user_id ? "#047857" : "#1d4ed8",
            border: candidate.linked_user_id ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
          }}>
            {candidate.linked_user_id ? "✓ Registered" : "Invited"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 16px rgba(15,23,42,0.06)" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
          <button style={tabStyle(tab === "details")}  onClick={() => setTab("details")}>Details</button>
          <button style={tabStyle(tab === "bookings")} onClick={() => setTab("bookings")}>
            Bookings {bookings.length > 0 ? `(${bookings.length})` : ""}
          </button>
          <button style={tabStyle(tab === "activity")} onClick={() => setTab("activity")}>
            Activity {activities.length > 0 ? `(${activities.length})` : ""}
          </button>
        </div>

        <div style={{ padding: "24px" }}>

          {/* ── Details Tab ── */}
          {tab === "details" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {[
                { label: "Full Name",     value: candidate.full_name },
                { label: "Email",         value: candidate.email || "—" },
                { label: "Phone",         value: candidate.phone || "—" },
                { label: "Date of Birth", value: formatDate(candidate.date_of_birth) },
                { label: "Added",         value: formatDate(candidate.created_at) },
                { label: "Portal Access", value: candidate.linked_user_id ? "Active" : "Not yet registered" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                  <p style={{ margin: "6px 0 0", fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>{item.value}</p>
                </div>
              ))}
              {candidate.notes && (
                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</p>
                  <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>{candidate.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Bookings Tab ── */}
          {tab === "bookings" && (
            <div>
              {bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ fontSize: "36px", marginBottom: "12px" }}>🗓</p>
                  <p style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>No bookings yet</p>
                  <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>Create a booking for this candidate from the Bookings page.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {bookings.map((b) => {
                    const progress = b.total_tests > 0 ? Math.round((Number(b.completed_tests) / Number(b.total_tests)) * 100) : 0;
                    return (
                      <div key={b.id} style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
                              {b.assessment_type_name || "—"}
                            </p>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                              {formatDate(b.appointment_date)}{b.appointment_time ? ` at ${b.appointment_time}` : ""}
                              {b.clinic_location ? ` · ${b.clinic_location}` : ""}
                            </p>
                          </div>
                          <span style={{
                            borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: 700,
                            background: b.status === "COMPLETED" ? "#ecfdf5" : b.status === "CANCELLED" ? "#fef2f2" : "#eff6ff",
                            color: b.status === "COMPLETED" ? "#047857" : b.status === "CANCELLED" ? "#b91c1c" : "#1d4ed8",
                            border: b.status === "COMPLETED" ? "1px solid #a7f3d0" : b.status === "CANCELLED" ? "1px solid #fecaca" : "1px solid #bfdbfe",
                          }}>
                            {b.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        {b.total_tests > 0 && (
                          <div style={{ marginTop: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>Tests completed</span>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{b.completed_tests}/{b.total_tests}</span>
                            </div>
                            <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#10b981" : "#119ee8", borderRadius: "999px", transition: "width 0.3s" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Activity Tab ── */}
          {tab === "activity" && (
            <div>
              {activities.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ fontSize: "36px", marginBottom: "12px" }}>📋</p>
                  <p style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>No activity yet</p>
                  <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>Actions taken on this candidate will appear here.</p>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  {/* Vertical line */}
                  <div style={{ position: "absolute", left: "19px", top: 0, bottom: 0, width: "2px", background: "#e2e8f0" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    {activities.map((activity, i) => {
                      const meta = ACTIVITY_META[activity.action_type] || { icon: "•", color: "#94a3b8", label: activity.action_type };
                      const isLast = i === activities.length - 1;
                      return (
                        <div key={activity.id} style={{ display: "flex", gap: "16px", paddingBottom: isLast ? 0 : "24px", position: "relative" }}>
                          {/* Icon dot */}
                          <div style={{
                            width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                            background: `${meta.color}18`,
                            border: `2px solid ${meta.color}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "18px", zIndex: 1, background: "#fff",
                          }}>
                            {meta.icon}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, paddingTop: "8px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                {meta.label}
                              </p>
                              <span style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                                {formatDateTime(activity.created_at)}
                              </span>
                            </div>

                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                              {activity.description}
                            </p>

                            {activity.performed_by_name && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                                <div style={{
                                  width: "20px", height: "20px", borderRadius: "50%",
                                  background: roleBadge(activity.performed_by_role),
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "10px", fontWeight: 700, color: "#fff",
                                }}>
                                  {activity.performed_by_name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                  {activity.performed_by_name}
                                  {activity.performed_by_role && (
                                    <span style={{ color: "#94a3b8" }}> ({activity.performed_by_role.charAt(0) + activity.performed_by_role.slice(1).toLowerCase()})</span>
                                  )}
                                </span>
                              </div>
                            )}

                            {activity.booking_id && activity.assessment_type_name && (
                              <div style={{ marginTop: "6px", background: "#f8fafc", borderRadius: "8px", padding: "6px 10px", display: "inline-block" }}>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                  🗓 {activity.assessment_type_name}
                                  {activity.appointment_date ? ` · ${formatDate(activity.appointment_date)}` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}