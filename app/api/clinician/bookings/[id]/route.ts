import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "CLINICIAN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const result = await db.query(
      `
      SELECT
        b.*,
        c.id AS candidate_id,
        c.full_name AS candidate_name,
        c.email AS candidate_email,
        c.phone,
        c.date_of_birth,

        bc.id AS consent_id,
        bc.consent_given,
        bc.full_name AS consent_name,
        bc.signed_at,

        bq.id AS questionnaire_id,
        bq.medical_history,
        bq.current_symptoms,
        bq.medications,
        bq.allergies,
        bq.submitted

      FROM bookings b

      JOIN candidates c
        ON c.id = b.candidate_id

      LEFT JOIN booking_consents bc
        ON bc.booking_id = b.id

      LEFT JOIN booking_questionnaires bq
        ON bq.booking_id = b.id

      WHERE b.id = $1
        AND b.assigned_clinician_id = $2
      `,
      [bookingId, sessionUser.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: result.rows[0] });
  } catch (error) {
    console.error("GET clinician booking detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking detail" },
      { status: 500 }
    );
  }
}