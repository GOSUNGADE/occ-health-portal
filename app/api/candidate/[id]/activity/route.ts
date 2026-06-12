import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (sessionUser.role !== "EMPLOYER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    const candidateId = Number(id);
    if (Number.isNaN(candidateId)) return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });

    const companyId = sessionUser.company_id ?? sessionUser.id;

    // Verify candidate belongs to this company
    const candidateCheck = await db.query(
      `SELECT id FROM candidates WHERE id = $1 AND employer_id = $2`,
      [candidateId, companyId]
    );

    if (candidateCheck.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const result = await db.query(
      `
      SELECT
        cal.id,
        cal.candidate_id,
        cal.booking_id,
        cal.action_type,
        cal.description,
        cal.performed_by_user_id,
        cal.performed_by_name,
        cal.performed_by_role,
        cal.metadata,
        cal.ip_address,
        cal.created_at,
        b.appointment_date,
        at.name AS assessment_type_name
      FROM candidate_activity_logs cal
      LEFT JOIN bookings b ON b.id = cal.booking_id
      LEFT JOIN assessment_types at ON at.id = b.assessment_type_id
      WHERE cal.candidate_id = $1
      ORDER BY cal.created_at DESC
      LIMIT 100
      `,
      [candidateId]
    );

    return NextResponse.json({ activities: result.rows });
  } catch (error) {
    console.error("GET /api/candidate/[id]/activity error:", error);
    return NextResponse.json({ error: "Failed to fetch activity log." }, { status: 500 });
  }
}