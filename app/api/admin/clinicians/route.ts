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
        id,
        full_name,
        email,
        is_active
      FROM users
      WHERE role = 'CLINICIAN'
      ORDER BY full_name ASC
      `
    );

    return NextResponse.json({ clinicians: result.rows });
  } catch (error) {
    console.error("GET /api/admin/clinicians error:", error);

    return NextResponse.json(
      { error: "Failed to fetch clinicians." },
      { status: 500 }
    );
  }
}