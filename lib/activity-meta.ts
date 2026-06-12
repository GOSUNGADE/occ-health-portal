// lib/activity-meta.ts
// UI-only constants — safe to import in Client Components

export const ACTIVITY_META: Record<string, { icon: string; color: string; label: string }> = {
  CANDIDATE_CREATED:            { icon: "👤", color: "#3b82f6", label: "Candidate Created" },
  CANDIDATE_UPDATED:            { icon: "✏️", color: "#8b5cf6", label: "Candidate Updated" },
  CANDIDATE_DELETED:            { icon: "🗑️", color: "#ef4444", label: "Candidate Deleted" },
  INVITE_SENT:                  { icon: "📧", color: "#3b82f6", label: "Invite Sent" },
  INVITE_REGENERATED:           { icon: "🔁", color: "#f59e0b", label: "Invite Regenerated" },
  CANDIDATE_REGISTERED:         { icon: "✅", color: "#10b981", label: "Candidate Registered" },
  BOOKING_CREATED:              { icon: "🗓", color: "#3b82f6", label: "Booking Created" },
  BOOKING_UPDATED:              { icon: "✏️", color: "#8b5cf6", label: "Booking Updated" },
  BOOKING_CANCELLED:            { icon: "❌", color: "#ef4444", label: "Booking Cancelled" },
  BOOKING_REOPENED:             { icon: "🔓", color: "#f59e0b", label: "Booking Reopened" },
  CLINICIAN_ASSIGNED:           { icon: "👨‍⚕️", color: "#06b6d4", label: "Clinician Assigned" },
  ASSESSMENT_STARTED:           { icon: "▶️", color: "#f59e0b", label: "Assessment Started" },
  ASSESSMENT_COMPLETED:         { icon: "🏁", color: "#10b981", label: "Assessment Completed" },
  TEST_COMPLETED:               { icon: "✔️", color: "#10b981", label: "Test Completed" },
  TEST_SKIPPED:                 { icon: "⏭️", color: "#94a3b8", label: "Test Skipped" },
  DOCUMENT_UPLOADED:            { icon: "📎", color: "#8b5cf6", label: "Document Uploaded" },
  DOCUMENT_DELETED:             { icon: "🗑️", color: "#ef4444", label: "Document Deleted" },
  CONSENT_SUBMITTED:            { icon: "📝", color: "#10b981", label: "Consent Submitted" },
  QUESTIONNAIRE_SUBMITTED:      { icon: "📋", color: "#10b981", label: "Questionnaire Submitted" },
  REPORT_UPLOADED:              { icon: "📄", color: "#06b6d4", label: "Report Uploaded" },
  FITNESS_CERTIFICATE_RELEASED: { icon: "🏅", color: "#10b981", label: "Fitness Certificate Released" },
};