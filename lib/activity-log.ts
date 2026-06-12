import { db } from "@/lib/db";

export type ActivityUser = {
  id: number;
  full_name: string;
  role: string;
};

export type LogActivityParams = {
  candidateId: number;
  bookingId?: number | null;
  user: ActivityUser;
  actionType: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logCandidateActivity({
  candidateId,
  bookingId = null,
  user,
  actionType,
  description,
  metadata = null,
  ipAddress = null,
  userAgent = null,
}: LogActivityParams): Promise<void> {
  try {
    await db.query(
      `
      INSERT INTO candidate_activity_logs (
        candidate_id,
        booking_id,
        action_type,
        description,
        performed_by_user_id,
        performed_by_name,
        performed_by_role,
        metadata,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        candidateId,
        bookingId ?? null,
        actionType,
        description,
        user.id,
        user.full_name,
        user.role,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    // Non-blocking — never let logging break the main action
    console.error("Failed to log candidate activity:", error);
  }
}

// Action type constants — use these everywhere for consistency
export const ACTIVITY_ACTIONS = {
  // Candidate actions
  CANDIDATE_CREATED:           "CANDIDATE_CREATED",
  CANDIDATE_UPDATED:           "CANDIDATE_UPDATED",
  CANDIDATE_DELETED:           "CANDIDATE_DELETED",
  INVITE_SENT:                 "INVITE_SENT",
  INVITE_REGENERATED:          "INVITE_REGENERATED",
  CANDIDATE_REGISTERED:        "CANDIDATE_REGISTERED",

  // Booking actions
  BOOKING_CREATED:             "BOOKING_CREATED",
  BOOKING_UPDATED:             "BOOKING_UPDATED",
  BOOKING_CANCELLED:           "BOOKING_CANCELLED",
  BOOKING_REOPENED:            "BOOKING_REOPENED",

  // Clinical actions
  CLINICIAN_ASSIGNED:          "CLINICIAN_ASSIGNED",
  ASSESSMENT_STARTED:          "ASSESSMENT_STARTED",
  ASSESSMENT_COMPLETED:        "ASSESSMENT_COMPLETED",
  TEST_COMPLETED:              "TEST_COMPLETED",
  TEST_SKIPPED:                "TEST_SKIPPED",

  // Documents & forms
  DOCUMENT_UPLOADED:           "DOCUMENT_UPLOADED",
  DOCUMENT_DELETED:            "DOCUMENT_DELETED",
  CONSENT_SUBMITTED:           "CONSENT_SUBMITTED",
  QUESTIONNAIRE_SUBMITTED:     "QUESTIONNAIRE_SUBMITTED",
  REPORT_UPLOADED:             "REPORT_UPLOADED",
  FITNESS_CERTIFICATE_RELEASED: "FITNESS_CERTIFICATE_RELEASED",
} as const;

export type ActivityActionType = typeof ACTIVITY_ACTIONS[keyof typeof ACTIVITY_ACTIONS];

// Icon and colour mapping for the UI timeline
export const ACTIVITY_META: Record<string, { icon: string; color: string; label: string }> = {
  CANDIDATE_CREATED:           { icon: "👤", color: "#3b82f6", label: "Candidate Created" },
  CANDIDATE_UPDATED:           { icon: "✏️", color: "#8b5cf6", label: "Candidate Updated" },
  CANDIDATE_DELETED:           { icon: "🗑️", color: "#ef4444", label: "Candidate Deleted" },
  INVITE_SENT:                 { icon: "📧", color: "#3b82f6", label: "Invite Sent" },
  INVITE_REGENERATED:          { icon: "🔁", color: "#f59e0b", label: "Invite Regenerated" },
  CANDIDATE_REGISTERED:        { icon: "✅", color: "#10b981", label: "Candidate Registered" },
  BOOKING_CREATED:             { icon: "🗓", color: "#3b82f6", label: "Booking Created" },
  BOOKING_UPDATED:             { icon: "✏️", color: "#8b5cf6", label: "Booking Updated" },
  BOOKING_CANCELLED:           { icon: "❌", color: "#ef4444", label: "Booking Cancelled" },
  BOOKING_REOPENED:            { icon: "🔓", color: "#f59e0b", label: "Booking Reopened" },
  CLINICIAN_ASSIGNED:          { icon: "👨‍⚕️", color: "#06b6d4", label: "Clinician Assigned" },
  ASSESSMENT_STARTED:          { icon: "▶️", color: "#f59e0b", label: "Assessment Started" },
  ASSESSMENT_COMPLETED:        { icon: "🏁", color: "#10b981", label: "Assessment Completed" },
  TEST_COMPLETED:              { icon: "✔️", color: "#10b981", label: "Test Completed" },
  TEST_SKIPPED:                { icon: "⏭️", color: "#94a3b8", label: "Test Skipped" },
  DOCUMENT_UPLOADED:           { icon: "📎", color: "#8b5cf6", label: "Document Uploaded" },
  DOCUMENT_DELETED:            { icon: "🗑️", color: "#ef4444", label: "Document Deleted" },
  CONSENT_SUBMITTED:           { icon: "📝", color: "#10b981", label: "Consent Submitted" },
  QUESTIONNAIRE_SUBMITTED:     { icon: "📋", color: "#10b981", label: "Questionnaire Submitted" },
  REPORT_UPLOADED:             { icon: "📄", color: "#06b6d4", label: "Report Uploaded" },
  FITNESS_CERTIFICATE_RELEASED:{ icon: "🏅", color: "#10b981", label: "Fitness Certificate Released" },
};