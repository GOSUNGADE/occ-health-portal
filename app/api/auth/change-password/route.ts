import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  createSessionToken,
  getSessionUser,
  setSessionCookie,
} from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      SELECT id, email, password_hash, role, is_active, must_change_password
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [sessionUser.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: "This account is inactive" },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );

    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from the current password" },
        { status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `
      UPDATE users
      SET password_hash = $1,
          must_change_password = FALSE,
          updated_at = NOW()
      WHERE id = $2
      `,
      [newPasswordHash, user.id]
    );

    const newToken = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      must_change_password: false,
    });

    await setSessionCookie(newToken);

    let redirectTo = "/login";

    if (user.role === "ADMIN") {
      redirectTo = "/admin/dashboard";
    } else if (user.role === "CLINICIAN") {
      redirectTo = "/clinician/dashboard";
    } else if (user.role === "EMPLOYER") {
      redirectTo = "/employer/dashboard";
    }

    return NextResponse.json({
      message: "Password changed successfully",
      redirectTo,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        must_change_password: false,
      },
    });
  } catch (error) {
    console.error("PATCH /api/auth/change-password error:", error);

    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
