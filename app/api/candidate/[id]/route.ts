import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logCandidateActivity, ACTIVITY_ACTIONS } from "@/lib/activity-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (sessionUser.role !== "EMPLOYER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    const candidateId = Number(id);
    if (Number.isNaN(candidateId)) return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const result = await db.query(
      `
      SELECT id, full_name, email, phone, date_of_birth, notes, linked_user_id, created_at, updated_at
      FROM candidates
      WHERE id = $1 AND employer_id = $2
      `,
      [candidateId, companyId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ candidate: result.rows[0] });
  } catch (error) {
    console.error("GET /api/candidate/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (sessionUser.role !== "EMPLOYER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    const candidateId = Number(id);
    if (Number.isNaN(candidateId)) return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });

    const body = await req.json();
    const fullName    = body.full_name?.trim();
    const email       = body.email?.trim().toLowerCase() || null;
    const phone       = body.phone?.trim() || null;
    const dateOfBirth = body.date_of_birth?.trim() || null;
    const notes       = body.notes?.trim() || null;

    if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const performerResult = await db.query(`SELECT full_name FROM users WHERE id = $1`, [sessionUser.id]);
    const performerName = performerResult.rows[0]?.full_name || sessionUser.email;

    const result = await db.query(
      `
      UPDATE candidates
      SET full_name = $1, email = $2, phone = $3, date_of_birth = $4, notes = $5, updated_at = NOW()
      WHERE id = $6 AND employer_id = $7
      RETURNING id, employer_id, full_name, email, phone, date_of_birth, notes, linked_user_id, created_at, updated_at
      `,
      [fullName, email, phone, dateOfBirth, notes, candidateId, companyId]
    );

    if (result.rows.length === 0) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    await logCandidateActivity({
      candidateId,
      user: { id: sessionUser.id, full_name: performerName, role: sessionUser.role },
      actionType: ACTIVITY_ACTIONS.CANDIDATE_UPDATED,
      description: `Candidate details updated by ${performerName}.`,
      metadata: { fullName, email, phone },
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    });

    return NextResponse.json({ message: "Candidate updated successfully", candidate: result.rows[0] });
  } catch (error) {
    console.error("PATCH /api/candidate/[id] error:", error);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const client = await db.connect();
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (sessionUser.role !== "EMPLOYER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    const candidateId = Number(id);
    if (Number.isNaN(candidateId)) return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const performerResult = await db.query(`SELECT full_name FROM users WHERE id = $1`, [sessionUser.id]);
    const performerName = performerResult.rows[0]?.full_name || sessionUser.email;

    await client.query("BEGIN");

    const candidateResult = await client.query(
      `SELECT id, full_name, linked_user_id FROM candidates WHERE id = $1 AND employer_id = $2`,
      [candidateId, companyId]
    );

    if (candidateResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const candidate = candidateResult.rows[0];

    console.log(`Candidate ${candidate.full_name} (id: ${candidateId}) deleted by ${performerName}`);

    await client.query(`DELETE FROM candidates WHERE id = $1 AND employer_id = $2`, [candidateId, companyId]);

    if (candidate.linked_user_id) {
      await client.query(`DELETE FROM users WHERE id = $1 AND role = 'CANDIDATE'`, [candidate.linked_user_id]);
    }

    await client.query("COMMIT");

    return NextResponse.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/candidate/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  } finally {
    client.release();
  }
}