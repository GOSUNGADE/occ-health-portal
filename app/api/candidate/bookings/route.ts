import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "CANDIDATE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await db.query(
      `
      SELECT
        b.id,
        b.appointment_date,
        b.appointment_time,
        b.status,
        b.assessment_type,
        b.clinic_location,
        b.created_at
      FROM bookings b
      INNER JOIN candidates c
        ON c.id = b.candidate_id
      WHERE c.linked_user_id = $1
      ORDER BY b.appointment_date DESC
      `,
      [sessionUser.id]
    );

    return NextResponse.json({
      bookings: result.rows,
    });
  } catch (error) {
    console.error("GET /api/candidates/bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}