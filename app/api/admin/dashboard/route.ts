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

    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'CLINICIAN')                          AS total_clinicians,
        COUNT(*) FILTER (WHERE role = 'CLINICIAN' AND is_active = true)     AS active_clinicians,
        COUNT(*) FILTER (WHERE role = 'ADMIN')                              AS total_admins,
        COUNT(*) FILTER (WHERE role = 'ADMIN' AND is_active = true)         AS active_admins
      FROM users
      WHERE role IN ('ADMIN', 'CLINICIAN')
    `);

    const bookingsResult = await db.query(`
      SELECT
        COUNT(*)                                                             AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'PENDING')                          AS pending_bookings,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')                        AS completed_bookings,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')    AS bookings_last_30_days
      FROM bookings
    `);

    const employersResult = await db.query(`
      SELECT COUNT(*) AS total_employers
      FROM users
      WHERE role = 'EMPLOYER' AND is_active = true
    `);

    const stats = result.rows[0];
    const bookings = bookingsResult.rows[0];
    const employers = employersResult.rows[0];

    return NextResponse.json({
      total_clinicians: Number(stats.total_clinicians),
      active_clinicians: Number(stats.active_clinicians),
      total_admins: Number(stats.total_admins),
      active_admins: Number(stats.active_admins),
      total_bookings: Number(bookings.total_bookings),
      pending_bookings: Number(bookings.pending_bookings),
      completed_bookings: Number(bookings.completed_bookings),
      bookings_last_30_days: Number(bookings.bookings_last_30_days),
      total_employers: Number(employers.total_employers),
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats." },
      { status: 500 }
    );
  }
}