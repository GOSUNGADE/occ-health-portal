import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const client = await db.connect();

  try {
    const body = await req.json();

    const fullName = body.full_name?.trim();
    const companyName = body.company_name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!fullName || !companyName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await db.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // Insert user without company_id first (we need their id)
    const result = await client.query(
      `
      INSERT INTO users (
        full_name,
        company_name,
        email,
        password_hash,
        role,
        employer_role
      )
      VALUES ($1, $2, $3, $4, 'EMPLOYER', 'ADMIN')
      RETURNING id, email, role, must_change_password
      `,
      [fullName, companyName, email, passwordHash]
    );

    const user = result.rows[0];

    // Set company_id to their own id — they are the company owner
    await client.query(
      `UPDATE users SET company_id = $1 WHERE id = $1`,
      [user.id]
    );

    await client.query("COMMIT");

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      must_change_password: user.must_change_password ?? false,
      company_id: user.id,
      employer_role: "ADMIN",
    });

    await setSessionCookie(token);

    return NextResponse.json({
      message: "Registration successful",
      redirectTo: "/employer/dashboard",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}