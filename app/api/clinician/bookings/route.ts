import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "CLINICIAN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await db.query(
      `
      SELECT
        b.id,
        b.appointment_date,
        b.appointment_time,
        b.clinic_location,
        b.assessment_type,
        b.status,
        b.priority,
        c.full_name AS candidate_name,
        c.email AS candidate_email
      FROM bookings b
      JOIN candidates c
        ON b.candidate_id = c.id
      WHERE b.assigned_clinician_id = $1
      ORDER BY b.appointment_date DESC, b.appointment_time DESC NULLS LAST
      `,
      [sessionUser.id]
    );

    return NextResponse.json({ bookings: result.rows });
  } catch (error) {
    console.error("GET /api/clinician/bookings error:", error);

    return NextResponse.json(
      { error: "Failed to fetch clinician bookings." },
      { status: 500 }
    );
  }
}
