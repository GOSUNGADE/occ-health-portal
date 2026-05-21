import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const client = await db.connect();

  try {
    const body = await req.json();

    const token = body.token?.trim();
    const fullName = body.full_name?.trim();
    const password = body.password?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const inviteResult = await client.query(
      `
      SELECT
        ci.id,
        ci.candidate_id,
        ci.email AS invite_email,
        ci.token,
        ci.expires_at,
        ci.used_at,
        c.full_name AS candidate_full_name,
        c.email AS candidate_email,
        c.linked_user_id
      FROM candidate_invites ci
      INNER JOIN candidates c
        ON c.id = ci.candidate_id
      WHERE ci.token = $1
      LIMIT 1
      `,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    const invite = inviteResult.rows[0];

    if (invite.used_at) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "This invite link has already been used" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(invite.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "This invite link has expired" },
        { status: 400 }
      );
    }

    if (invite.linked_user_id) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Candidate account has already been registered" },
        { status: 400 }
      );
    }

    const registrationEmail = (
      invite.candidate_email ||
      invite.invite_email
    )?.toLowerCase();

    if (!registrationEmail) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Candidate email is missing" },
        { status: 400 }
      );
    }

    const existingUserResult = await client.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [registrationEmail]
    );

    if (existingUserResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        must_change_password
      )
      VALUES ($1, $2, $3, 'CANDIDATE', FALSE)
      RETURNING id, email, role, must_change_password
      `,
      [fullName, registrationEmail, passwordHash]
    );

    const newUser = userResult.rows[0];

    await client.query(
      `
      UPDATE candidates
      SET
        full_name = $1,
        linked_user_id = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [fullName, newUser.id, invite.candidate_id]
    );

    await client.query(
      `
      UPDATE candidate_invites
      SET used_at = NOW()
      WHERE id = $1
      `,
      [invite.id]
    );

    await client.query("COMMIT");

    const sessionToken = createSessionToken({
      id: Number(newUser.id),
      email: newUser.email,
      role: newUser.role,
      must_change_password: newUser.must_change_password,
    });

    await setSessionCookie(sessionToken);

    return NextResponse.json({
      message: "Candidate registered successfully",
      redirectTo: "/candidate/dashboard",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/candidate-invites/register error:", error);
    return NextResponse.json(
      { error: "Failed to register candidate" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}