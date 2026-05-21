import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await db.query(
      `
      SELECT
        b.*,
        c.full_name AS candidate_name,
        c.email AS candidate_email
      FROM bookings b
      JOIN candidates c
        ON b.candidate_id = c.id
      ORDER BY b.created_at DESC
      `
    );

    return NextResponse.json({ bookings: result.rows });
  } catch (error) {
    console.error("GET /api/admin/bookings error:", error);

    return NextResponse.json(
      { error: "Failed to fetch bookings." },
      { status: 500 }
    );
  }
}