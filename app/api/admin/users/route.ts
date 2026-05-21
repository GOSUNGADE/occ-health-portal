import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await db.query(
      `
      SELECT
        id,
        full_name,
        company_name,
        email,
        role,
        is_active,
        must_change_password,
        created_at,
        updated_at
      FROM users
      WHERE role IN ('ADMIN', 'CLINICIAN')
      ORDER BY created_at DESC
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);

    return NextResponse.json(
      { error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "").trim().toUpperCase();
    const isActive =
      typeof body.is_active === "boolean" ? body.is_active : true;

    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Full name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (!["ADMIN", "CLINICIAN"].includes(role)) {
      return NextResponse.json(
        { error: "Only ADMIN or CLINICIAN can be created here." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existingUser = await db.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const mustChangePassword = true;

    const result = await db.query(
      `
      INSERT INTO users (
        full_name,
        company_name,
        email,
        password_hash,
        role,
        is_active,
        must_change_password
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        full_name,
        company_name,
        email,
        role,
        is_active,
        must_change_password,
        created_at,
        updated_at
      `,
      [fullName, null, email, passwordHash, role, isActive, mustChangePassword]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);

    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}