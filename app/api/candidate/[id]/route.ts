import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const candidateId = Number(id);

    if (Number.isNaN(candidateId)) {
      return NextResponse.json(
        { error: "Invalid candidate id" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const fullName = body.full_name?.trim();
    const email = body.email?.trim().toLowerCase() || null;
    const phone = body.phone?.trim() || null;
    const dateOfBirth = body.date_of_birth?.trim() || null;
    const notes = body.notes?.trim() || null;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      UPDATE candidates
      SET
        full_name = $1,
        email = $2,
        phone = $3,
        date_of_birth = $4,
        notes = $5,
        updated_at = NOW()
      WHERE id = $6
        AND employer_id = $7
      RETURNING
        id,
        employer_id,
        full_name,
        email,
        phone,
        date_of_birth,
        notes,
        linked_user_id,
        created_at,
        updated_at
      `,
      [
        fullName,
        email,
        phone,
        dateOfBirth,
        notes,
        candidateId,
        sessionUser.id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Candidate updated successfully",
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH candidate error:", error);
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const client = await db.connect();

  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const candidateId = Number(id);

    if (Number.isNaN(candidateId)) {
      return NextResponse.json(
        { error: "Invalid candidate id" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const candidateResult = await client.query(
      `
      SELECT id, linked_user_id
      FROM candidates
      WHERE id = $1
        AND employer_id = $2
      `,
      [candidateId, sessionUser.id]
    );

    if (candidateResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const linkedUserId = candidateResult.rows[0].linked_user_id;

    await client.query(
      `
      DELETE FROM candidates
      WHERE id = $1
        AND employer_id = $2
      `,
      [candidateId, sessionUser.id]
    );

    if (linkedUserId) {
      await client.query(
        `
        DELETE FROM users
        WHERE id = $1
          AND role = 'CANDIDATE'
        `,
        [linkedUserId]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE candidate error:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}