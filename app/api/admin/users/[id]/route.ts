import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/admin/users/[id] — edit or disable/enable a user
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json();

    // Build dynamic update fields
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.full_name !== undefined) {
      const fullName = String(body.full_name).trim();
      if (!fullName) {
        return NextResponse.json(
          { error: "Full name cannot be empty" },
          { status: 400 }
        );
      }
      fields.push(`full_name = $${idx++}`);
      values.push(fullName);
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!email) {
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 }
        );
      }
      // Check uniqueness (excluding the user being updated)
      const existing = await db.query(
        `SELECT id FROM users WHERE email = $1 AND id != $2 LIMIT 1`,
        [email, userId]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: "A user with that email already exists." },
          { status: 409 }
        );
      }
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (body.role !== undefined) {
      const role = String(body.role).trim().toUpperCase();
      if (!["ADMIN", "CLINICIAN"].includes(role)) {
        return NextResponse.json(
          { error: "Role must be ADMIN or CLINICIAN" },
          { status: 400 }
        );
      }
      fields.push(`role = $${idx++}`);
      values.push(role);
    }

    if (body.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(Boolean(body.is_active));
    }

    if (body.password !== undefined && body.password !== "") {
      const password = String(body.password);
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
      fields.push(`must_change_password = $${idx++}`);
      values.push(true);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await db.query(
      `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${idx}
        AND role IN ('ADMIN', 'CLINICIAN')
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
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] — permanently delete a user
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === sessionUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      DELETE FROM users
      WHERE id = $1
        AND role IN ('ADMIN', 'CLINICIAN')
      RETURNING id
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}