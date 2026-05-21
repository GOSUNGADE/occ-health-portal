import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "CANDIDATE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await db.query(
      `
      SELECT
        c.id,
        c.full_name,
        c.email,
        c.phone,
        c.date_of_birth,
        c.created_at
      FROM candidates c
      WHERE c.linked_user_id = $1
      LIMIT 1
      `,
      [sessionUser.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error("GET /api/candidate/me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 }
    );
  }
}