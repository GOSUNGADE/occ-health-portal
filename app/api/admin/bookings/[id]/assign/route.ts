import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (!Number.isFinite(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const rawClinicianId =
      body?.assignedClinicianId ??
      body?.clinicianId ??
      body?.assigned_clinician_id ??
      null;

    const normalizedClinicianId =
      rawClinicianId === null ||
      rawClinicianId === "" ||
      rawClinicianId === "null" ||
      rawClinicianId === "undefined"
        ? null
        : Number(rawClinicianId);

    const bookingResult = await db.query(
      `
      SELECT id
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (normalizedClinicianId === null) {
      const updateResult = await db.query(
        `
        UPDATE bookings
        SET
          assigned_clinician_id = NULL,
          assigned_clinician = NULL,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [bookingId]
      );

      return NextResponse.json({
        success: true,
        message: "Clinician unassigned successfully.",
        booking: updateResult.rows[0],
        clinician: null,
      });
    }

    if (!Number.isFinite(normalizedClinicianId)) {
      return NextResponse.json(
        { error: "Invalid clinician id.", received: rawClinicianId },
        { status: 400 }
      );
    }

    const clinicianResult = await db.query(
      `
      SELECT id, full_name, email, role
      FROM users
      WHERE id = $1
      `,
      [normalizedClinicianId]
    );

    if (clinicianResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Clinician not found." },
        { status: 404 }
      );
    }

    const clinician = clinicianResult.rows[0];

    if (clinician.role !== "CLINICIAN") {
      return NextResponse.json(
        { error: "Selected user is not a clinician." },
        { status: 400 }
      );
    }

    const updateResult = await db.query(
      `
      UPDATE bookings
      SET
        assigned_clinician_id = $1,
        assigned_clinician = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [clinician.id, clinician.full_name, bookingId]
    );

    return NextResponse.json({
      success: true,
      message: "Clinician assigned successfully.",
      booking: updateResult.rows[0],
      clinician: {
        id: clinician.id,
        full_name: clinician.full_name,
        email: clinician.email,
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/bookings/[id]/assign error:", error);

    return NextResponse.json(
      { error: "Failed to assign clinician." },
      { status: 500 }
    );
  }
}