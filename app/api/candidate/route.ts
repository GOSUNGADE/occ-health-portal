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

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await db.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        date_of_birth,
        notes,
        linked_user_id,
        created_at,
        updated_at
      FROM candidates
      WHERE employer_id = $1
      ORDER BY created_at DESC
      `,
      [sessionUser.id]
    );

    return NextResponse.json({ candidates: result.rows });
  } catch (error) {
    console.error("GET /api/candidates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const client = await db.connect();

  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!email) {
      return NextResponse.json(
        { error: "Candidate email is required for invitation" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const candidateResult = await client.query(
      `
      INSERT INTO candidates (
        employer_id,
        full_name,
        email,
        phone,
        date_of_birth,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
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
      [sessionUser.id, fullName, email, phone, dateOfBirth, notes]
    );

    const candidate = candidateResult.rows[0];

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
      [candidate.id, email, token, expiresAt]
    );

    await client.query("COMMIT");

    const inviteLink = `${req.nextUrl.origin}/candidate/register?token=${token}`;

    return NextResponse.json(
      {
        message: "Candidate created and invite generated successfully",
        candidate,
        inviteLink,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/candidates error:", error);
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}