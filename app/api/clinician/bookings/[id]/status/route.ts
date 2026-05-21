import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export async function PATCH(
  req: NextRequest,
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

    const body = await req.json();
    const newStatus = body.status;

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const ownershipCheck = await db.query(
      `
      SELECT id
      FROM bookings
      WHERE id = $1
        AND assigned_clinician_id = $2
      `,
      [bookingId, sessionUser.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const result = await db.query(
      `
      UPDATE bookings
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [newStatus, bookingId]
    );

    return NextResponse.json({
      message: "Status updated successfully",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH booking status error:", error);

    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}