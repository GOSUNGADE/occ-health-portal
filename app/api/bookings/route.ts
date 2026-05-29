import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const result = await db.query(
      `
      SELECT
        b.id,
        b.employer_id,
        b.candidate_id,
        b.appointment_date,
        b.appointment_time,
        b.assessment_type,
        b.assessment_type_id,
        b.clinic_location,
        b.assigned_clinician,
        b.assigned_clinician_id,
        b.priority,
        b.status,
        b.notes,
        b.created_at,
        b.updated_at,

        c.full_name  AS candidate_name,
        c.email      AS candidate_email,

        at.name      AS assessment_type_name,
        at.industry  AS assessment_industry,
        at.duration_minutes,

        CASE WHEN bc.id IS NOT NULL THEN true ELSE false END AS consent_completed,
        CASE WHEN bq.submitted = true THEN true ELSE false END AS questionnaire_completed

      FROM bookings b
      JOIN candidates c ON b.candidate_id = c.id
      LEFT JOIN assessment_types at ON at.id = b.assessment_type_id
      LEFT JOIN booking_consents bc ON bc.booking_id = b.id
      LEFT JOIN booking_questionnaires bq ON bq.booking_id = b.id

      WHERE b.employer_id = $1
      ORDER BY b.created_at DESC
      `,
      [companyId]
    );

    return NextResponse.json({ bookings: result.rows });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const candidateId       = Number(body.candidate_id);
    const appointmentDate   = String(body.appointment_date ?? "").trim();
    const appointmentTime   = String(body.appointment_time ?? "").trim() || null;
    const assessmentTypeId  = body.assessment_type_id ? Number(body.assessment_type_id) : null;
    const clinicLocation    = String(body.clinic_location ?? "").trim() || null;
    const assignedClinician = String(body.assigned_clinician ?? "").trim() || null;
    const priority          = String(body.priority ?? "STANDARD").trim() || "STANDARD";
    const notes             = String(body.notes ?? "").trim() || null;

    if (!Number.isFinite(candidateId)) {
      return NextResponse.json({ error: "Valid candidate is required." }, { status: 400 });
    }

    if (!appointmentDate) {
      return NextResponse.json({ error: "Appointment date is required." }, { status: 400 });
    }

    if (!assessmentTypeId) {
      return NextResponse.json({ error: "Assessment type is required." }, { status: 400 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    // Verify candidate belongs to this company
    const candidateResult = await db.query(
      `SELECT id FROM candidates WHERE id = $1 AND employer_id = $2`,
      [candidateId, companyId]
    );

    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    // Fetch assessment type name for the legacy text column
    const assessmentTypeResult = await db.query(
      `SELECT name FROM assessment_types WHERE id = $1 AND is_active = TRUE`,
      [assessmentTypeId]
    );

    if (assessmentTypeResult.rows.length === 0) {
      return NextResponse.json({ error: "Assessment type not found." }, { status: 404 });
    }

    const assessmentTypeName = assessmentTypeResult.rows[0].name;

    const insertResult = await db.query(
      `
      INSERT INTO bookings (
        employer_id,
        candidate_id,
        appointment_date,
        appointment_time,
        assessment_type,
        assessment_type_id,
        clinic_location,
        assigned_clinician,
        priority,
        status,
        notes,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED', $10, NOW(), NOW())
      RETURNING *
      `,
      [
        companyId,
        candidateId,
        appointmentDate,
        appointmentTime,
        assessmentTypeName,
        assessmentTypeId,
        clinicLocation,
        assignedClinician,
        priority,
        notes,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Booking created successfully.",
      booking: insertResult.rows[0],
    });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
  }
}