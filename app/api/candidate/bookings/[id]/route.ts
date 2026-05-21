import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "CANDIDATE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking id" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      SELECT
        b.id,
        b.appointment_date,
        b.appointment_time,
        b.status,
        b.notes,
        b.assessment_type,
        b.clinic_location,
        b.assigned_clinician,
        b.priority,
        b.created_at,
        b.updated_at
      FROM bookings b
      INNER JOIN candidates c
        ON c.id = b.candidate_id
      WHERE b.id = $1
        AND c.linked_user_id = $2
      LIMIT 1
      `,
      [bookingId, sessionUser.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("GET /api/candidate/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}