import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, EmployerPermissions } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH — update role or active status of a sub-user
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!EmployerPermissions.canManageUsers(sessionUser.employer_role)) {
      return NextResponse.json({ error: "Only company admins can edit users." }, { status: 403 });
    }

    const { id } = await context.params;
    const userId = Number(id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    // Verify target user belongs to the same company and is not the owner
    const targetResult = await db.query(
      `SELECT id, company_id, employer_role FROM users WHERE id = $1 AND company_id = $2 AND role = 'EMPLOYER'`,
      [userId, companyId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const target = targetResult.rows[0];

    // Prevent editing the company owner account
    if (target.company_id === target.id) {
      return NextResponse.json(
        { error: "The company owner account cannot be modified." },
        { status: 400 }
      );
    }

    // Prevent self-edit
    if (userId === sessionUser.id) {
      return NextResponse.json(
        { error: "You cannot edit your own account here." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.employer_role !== undefined) {
      const role = String(body.employer_role).toUpperCase();
      if (!["ADMIN", "HR_MANAGER", "HR_STAFF", "READ_ONLY"].includes(role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      fields.push(`employer_role = $${idx++}`);
      values.push(role);
    }

    if (body.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(Boolean(body.is_active));
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await db.query(
      `
      UPDATE users SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, full_name, email, employer_role, is_active, created_at, company_id
      `,
      values
    );

    return NextResponse.json({ user: { ...result.rows[0], is_owner: false } });
  } catch (error) {
    console.error("PATCH /api/employer/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

// DELETE — remove a sub-user from the company
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!EmployerPermissions.canManageUsers(sessionUser.employer_role)) {
      return NextResponse.json({ error: "Only company admins can remove users." }, { status: 403 });
    }

    const { id } = await context.params;
    const userId = Number(id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    if (userId === sessionUser.id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const targetResult = await db.query(
      `SELECT id, company_id FROM users WHERE id = $1 AND company_id = $2 AND role = 'EMPLOYER'`,
      [userId, companyId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const target = targetResult.rows[0];

    if (target.company_id === target.id) {
      return NextResponse.json(
        { error: "The company owner account cannot be deleted." },
        { status: 400 }
      );
    }

    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);

    return NextResponse.json({ message: "User removed successfully." });
  } catch (error) {
    console.error("DELETE /api/employer/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to remove user." }, { status: 500 });
  }
}