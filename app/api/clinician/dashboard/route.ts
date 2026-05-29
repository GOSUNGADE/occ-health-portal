import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "CLINICIAN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clinicianId = user.id;

    const stats = await db.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE assigned_clinician_id = $1
          AND appointment_date = CURRENT_DATE
        ) AS assigned_today,

        COUNT(*) FILTER (
          WHERE assigned_clinician_id = $1
          AND status IN ('SCHEDULED','IN_PROGRESS')
        ) AS pending_assessments,

        COUNT(*) FILTER (
          WHERE assigned_clinician_id = $1
          AND status = 'COMPLETED'
          AND appointment_date >= CURRENT_DATE - INTERVAL '7 days'
        ) AS completed_this_week

      FROM bookings
      `,
      [clinicianId]
    );

    return NextResponse.json(stats.rows[0]);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}