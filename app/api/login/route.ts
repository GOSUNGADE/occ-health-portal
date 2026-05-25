import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      SELECT
        id,
        email,
        password_hash,
        role,
        is_active,
        must_change_password,
        company_id,
        employer_role
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account has been disabled. Please contact support." },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      must_change_password: user.must_change_password,
      company_id: user.company_id ?? undefined,
      employer_role: user.employer_role ?? undefined,
    });

    await setSessionCookie(token);

    let redirectTo = "/login";

    if (user.must_change_password) {
      redirectTo = "/change-password";
    } else if (user.role === "EMPLOYER") {
      redirectTo = "/employer/dashboard";
    } else if (user.role === "ADMIN") {
      redirectTo = "/admin/dashboard";
    } else if (user.role === "CLINICIAN") {
      redirectTo = "/clinician/dashboard";
    } else if (user.role === "CANDIDATE") {
      redirectTo = "/candidate/dashboard";
    }

    return NextResponse.json({ redirectTo });
  } catch (error) {
    console.error("POST /api/login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}