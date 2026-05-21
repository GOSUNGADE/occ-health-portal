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
        must_change_password
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

    if (user.role !== "CLINICIAN") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "This account is inactive" },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const mustChangePassword = user.must_change_password === true;

    const token = createSessionToken({
      id: Number(user.id),
      email: String(user.email),
      role: "CLINICIAN",
      must_change_password: mustChangePassword,
    });

    await setSessionCookie(token);

    const redirectTo = mustChangePassword
      ? "/clinician/change-password"
      : "/clinician/dashboard";

    

    return NextResponse.json({
      success: true,
      message: "Clinician login successful",
      redirectTo,
      user: {
        id: Number(user.id),
        email: String(user.email),
        role: "CLINICIAN",
        must_change_password: mustChangePassword,
      },
    });
  } catch (error) {
    console.error("POST /api/clinician/login error:", error);

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}