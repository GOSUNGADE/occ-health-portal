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

    if (!sessionUser || sessionUser.role !== "CANDIDATE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const bookingResult = await db.query(
      `
      SELECT
        b.id,
        c.id AS candidate_id
      FROM bookings b
      INNER JOIN candidates c ON c.id = b.candidate_id
      WHERE b.id = $1
        AND c.linked_user_id = $2
      `,
      [bookingId, sessionUser.id]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const questionnaireResult = await db.query(
      `
      SELECT
        id,
        booking_id,
        candidate_id,
        medical_history,
        current_symptoms,
        medications,
        allergies,
        submitted,
        created_at,
        updated_at
      FROM booking_questionnaires
      WHERE booking_id = $1
      `,
      [bookingId]
    );

    return NextResponse.json({
      questionnaire: questionnaireResult.rows[0] ?? null,
    });
  } catch (error) {
    console.error("GET booking questionnaire error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "CANDIDATE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const body = await req.json();

    const medicalHistory = String(body.medicalHistory ?? "").trim();
    const currentSymptoms = String(body.currentSymptoms ?? "").trim();
    const medications = String(body.medications ?? "").trim();
    const allergies = String(body.allergies ?? "").trim();

    const bookingResult = await db.query(
      `
      SELECT
        b.id,
        c.id AS candidate_id
      FROM bookings b
      INNER JOIN candidates c ON c.id = b.candidate_id
      WHERE b.id = $1
        AND c.linked_user_id = $2
      `,
      [bookingId, sessionUser.id]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const candidateId = bookingResult.rows[0].candidate_id;

    const existingQuestionnaire = await db.query(
      `
      SELECT id, submitted
      FROM booking_questionnaires
      WHERE booking_id = $1
      `,
      [bookingId]
    );

    if (existingQuestionnaire.rows.length > 0 && existingQuestionnaire.rows[0].submitted) {
      return NextResponse.json(
        { error: "Questionnaire already submitted for this booking" },
        { status: 409 }
      );
    }

    const upsertResult = await db.query(
      `
      INSERT INTO booking_questionnaires (
        booking_id,
        candidate_id,
        medical_history,
        current_symptoms,
        medications,
        allergies,
        submitted,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      ON CONFLICT (booking_id)
      DO UPDATE SET
        medical_history = EXCLUDED.medical_history,
        current_symptoms = EXCLUDED.current_symptoms,
        medications = EXCLUDED.medications,
        allergies = EXCLUDED.allergies,
        submitted = true,
        updated_at = NOW()
      RETURNING
        id,
        booking_id,
        candidate_id,
        medical_history,
        current_symptoms,
        medications,
        allergies,
        submitted,
        created_at,
        updated_at
      `,
      [
        bookingId,
        candidateId,
        medicalHistory,
        currentSymptoms,
        medications,
        allergies,
      ]
    );

    return NextResponse.json({
      message: "Questionnaire submitted successfully",
      questionnaire: upsertResult.rows[0],
    });
  } catch (error) {
    console.error("POST booking questionnaire error:", error);
    return NextResponse.json(
      { error: "Failed to submit questionnaire" },
      { status: 500 }
    );
  }
}