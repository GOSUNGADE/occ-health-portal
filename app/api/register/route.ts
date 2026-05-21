import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fullName = body.full_name?.trim();
    const companyName = body.company_name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    console.log("REGISTER BODY:", body);
    console.log("PARSED VALUES:", {
      fullName,
      companyName,
      email,
      password,
    });

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

    const result = await db.query(
      `
      INSERT INTO users (
        full_name,
        company_name,
        email,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, role
      `,
      [fullName, companyName, email, passwordHash, "EMPLOYER"]
    );

    const user = result.rows[0];

    const token = createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    must_change_password: user.must_change_password ?? false,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      message: "Registration successful",
      redirectTo: "/employer/dashboard",
    });
  } catch (error) {
    console.error("POST /api/register error:", error);

    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
