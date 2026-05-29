import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_PRIORITIES = new Set(["STANDARD", "PRIORITY", "URGENT"]);

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function cleanPriority(value: unknown) {
  const priority = String(value ?? "STANDARD")
    .trim()
    .toUpperCase();
  return ALLOWED_PRIORITIES.has(priority) ? priority : "STANDARD";
}

async function getEmployerContext() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (sessionUser.role !== "EMPLOYER") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    sessionUser,
    companyId: sessionUser.company_id ?? sessionUser.id,
  };
}

async function getEditableBooking(bookingId: number, companyId: number) {
  const result = await db.query(
    `
    SELECT id, employer_id, status, assigned_clinician_id
    FROM bookings
    WHERE id = $1 AND employer_id = $2
    `,
    [bookingId, companyId],
  );

  if (result.rows.length === 0) {
    return {
      error: NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      ),
    };
  }

  const booking = result.rows[0];

  if (
    booking.assigned_clinician_id !== null ||
    booking.status !== "SCHEDULED"
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "This booking has already been assigned or is no longer editable. Please contact the clinic.",
        },
        { status: 409 },
      ),
    };
  }

  return { booking };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    if (!Number.isFinite(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID." },
        { status: 400 },
      );
    }

    const context = await getEmployerContext();
    if (context.error) return context.error;

    const editable = await getEditableBooking(bookingId, context.companyId!);
    if (editable.error) return editable.error;

    const body = await req.json();

    const appointmentDate = String(body.appointment_date ?? "").trim();
    const appointmentTime = cleanText(body.appointment_time);
    const assessmentTypeId = body.assessment_type_id
      ? Number(body.assessment_type_id)
      : null;
    const clinicLocation = cleanText(body.clinic_location);
    const preferredClinician = cleanText(body.preferred_clinician);
    const priority = cleanPriority(body.priority);
    const notes = cleanText(body.notes);

    if (!appointmentDate) {
      return NextResponse.json(
        { error: "Appointment date is required." },
        { status: 400 },
      );
    }

    if (!assessmentTypeId || !Number.isFinite(assessmentTypeId)) {
      return NextResponse.json(
        { error: "Assessment type is required." },
        { status: 400 },
      );
    }

    const assessmentTypeResult = await db.query(
      `SELECT id, name FROM assessment_types WHERE id = $1 AND is_active = TRUE`,
      [assessmentTypeId],
    );

    if (assessmentTypeResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Assessment type not found." },
        { status: 404 },
      );
    }

    const assessmentTypeName = assessmentTypeResult.rows[0].name;

    const updateResult = await db.query(
      `
      UPDATE bookings
      SET
        appointment_date = $1,
        appointment_time = $2,
        assessment_type = $3,
        assessment_type_id = $4,
        clinic_location = $5,
        preferred_clinician = $6,
        priority = $7,
        notes = $8,
        updated_at = NOW()
      WHERE id = $9
        AND employer_id = $10
        AND assigned_clinician_id IS NULL
        AND status = 'SCHEDULED'
      RETURNING *
      `,
      [
        appointmentDate,
        appointmentTime,
        assessmentTypeName,
        assessmentTypeId,
        clinicLocation,
        preferredClinician,
        priority,
        notes,
        bookingId,
        context.companyId,
      ],
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Booking could not be updated. It may have been assigned by the clinic.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully.",
      booking: updateResult.rows[0],
    });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update booking." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    if (!Number.isFinite(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID." },
        { status: 400 },
      );
    }

    const context = await getEmployerContext();
    if (context.error) return context.error;

    const editable = await getEditableBooking(bookingId, context.companyId!);
    if (editable.error) return editable.error;

    const body = await req.json().catch(() => ({}));
    const reason = cleanText(body.cancellation_reason);

    const cancelResult = await db.query(
      `
      UPDATE bookings
      SET
        status = 'CANCELLED',
        cancelled_at = NOW(),
        cancelled_by = $1,
        cancellation_reason = $2,
        updated_at = NOW()
      WHERE id = $3
        AND employer_id = $4
        AND assigned_clinician_id IS NULL
        AND status = 'SCHEDULED'
      RETURNING *
      `,
      [context.sessionUser!.id, reason, bookingId, context.companyId],
    );

    if (cancelResult.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Booking could not be cancelled. It may have been assigned by the clinic.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully.",
      booking: cancelResult.rows[0],
    });
  } catch (error) {
    console.error("DELETE /api/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking." },
      { status: 500 },
    );
  }
}
