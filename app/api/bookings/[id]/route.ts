import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const bookingId = Number(id);

    const body = await req.json();

    const {
      candidate_id,
      appointment_date,
      appointment_time,
      assessment_type,
      clinic_location,
      assigned_clinician,
      priority,
      status,
      notes,
    } = body;

    const result = await db.query(
      `
      UPDATE bookings
      SET
        candidate_id=$1,
        appointment_date=$2,
        appointment_time=$3,
        assessment_type=$4,
        clinic_location=$5,
        assigned_clinician=$6,
        priority=$7,
        status=$8,
        notes=$9,
        updated_at=NOW()
      WHERE id=$10 AND employer_id=$11
      RETURNING *
      `,
      [
        candidate_id,
        appointment_date,
        appointment_time,
        assessment_type,
        clinic_location,
        assigned_clinician,
        priority,
        status,
        notes,
        bookingId,
        user.id,
      ]
    );

    return NextResponse.json({ booking: result.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: Context) {
  const user = await getSessionUser();
  const { id } = await context.params;

  await db.query(`DELETE FROM bookings WHERE id=$1 AND employer_id=$2`, [
    id,
    user?.id,
  ]);

  return NextResponse.json({ message: "Deleted" });
}
