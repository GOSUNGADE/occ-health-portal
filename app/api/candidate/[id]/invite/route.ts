import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getInviteExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
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

    // Get candidate
    const candidateResult = await client.query(
      `
      SELECT id, email, linked_user_id
      FROM candidates
      WHERE id = $1 AND employer_id = $2
      `,
      [candidateId, sessionUser.id]
    );

    if (candidateResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const candidate = candidateResult.rows[0];

    if (candidate.linked_user_id) {
      return NextResponse.json(
        { error: "Candidate already registered" },
        { status: 400 }
      );
    }

    // Expire old invites (optional but clean)
    await client.query(
      `
      UPDATE candidate_invites
      SET used_at = NOW()
      WHERE candidate_id = $1 AND used_at IS NULL
      `,
      [candidateId]
    );

    const token = generateInviteToken();
    const expiresAt = getInviteExpiryDate();

    await client.query(
      `
      INSERT INTO candidate_invites (
        candidate_id,
        email,
        token,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      `,
      [candidateId, candidate.email, token, expiresAt]
    );

    await client.query("COMMIT");

    const inviteLink = `${req.nextUrl.origin}/candidate/register?token=${token}`;

    return NextResponse.json({
      message: "Invite regenerated successfully",
      inviteLink,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Regenerate invite error:", error);

    return NextResponse.json(
      { error: "Failed to regenerate invite" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}