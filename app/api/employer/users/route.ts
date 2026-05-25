import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { getSessionUser, EmployerPermissions } from "@/lib/auth";
import { BRANDING } from "@/lib/branding";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmployerRoleType = "ADMIN" | "HR_MANAGER" | "HR_STAFF" | "READ_ONLY";

const ROLE_LABELS: Record<EmployerRoleType, string> = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  HR_STAFF: "HR Staff",
  READ_ONLY: "Read Only",
};

function buildInviteEmail(
  fullName: string,
  email: string,
  password: string,
  role: EmployerRoleType,
  companyName: string
) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/login`;
  return {
    subject: `You've been added to ${companyName} on ${BRANDING.shortName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
      <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
              <tr>
                <td style="background:linear-gradient(135deg,#0b1220 0%,#11203d 55%,#119ee8 100%);border-radius:20px 20px 0 0;padding:32px 36px;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="width:48px;height:48px;background:#1fb6ff;border-radius:12px;text-align:center;vertical-align:middle;font-size:22px;font-weight:700;color:#fff;">${BRANDING.logoLetter}</td>
                    <td style="padding-left:14px;">
                      <p style="margin:0;font-size:18px;font-weight:700;color:#fff;">${BRANDING.appName}</p>
                      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Employer Portal</p>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="background:#fff;padding:36px;border-left:1px solid #e9eef5;border-right:1px solid #e9eef5;">
                  <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#101828;">Hi ${fullName},</h1>
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
                    You've been added to <strong>${companyName}</strong>'s employer account on ${BRANDING.shortName} as <strong>${ROLE_LABELS[role]}</strong>.
                    Use the credentials below to sign in.
                  </p>
                  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                    <tr>
                      <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;">
                        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your Login Details</p>
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding:5px 0;font-size:14px;color:#64748b;width:80px;">Email</td>
                            <td style="padding:5px 0;font-size:14px;font-weight:600;color:#0f172a;">${email}</td>
                          </tr>
                          <tr>
                            <td style="padding:5px 0;font-size:14px;color:#64748b;">Password</td>
                            <td style="padding:5px 0;font-size:14px;font-weight:600;color:#0f172a;font-family:monospace;">${password}</td>
                          </tr>
                          <tr>
                            <td style="padding:5px 0;font-size:14px;color:#64748b;">Role</td>
                            <td style="padding:5px 0;font-size:14px;font-weight:600;color:#0f172a;">${ROLE_LABELS[role]}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 20px;font-size:14px;color:#f59e0b;font-weight:600;">⚠️ Please change your password after first login.</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#119ee8;border-radius:14px;">
                        <a href="${loginUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">Sign in →</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border:1px solid #e9eef5;border-top:none;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;">If you weren't expecting this, please ignore this email.</p>
                  <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} ${BRANDING.shortName}. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// GET — list all users in the same company
export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!EmployerPermissions.canManageUsers(sessionUser.employer_role)) {
      return NextResponse.json({ error: "Only company admins can manage users." }, { status: 403 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const result = await db.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.employer_role,
        u.is_active,
        u.created_at,
        u.company_id,
        -- flag to identify the original owner
        (u.company_id = u.id) AS is_owner
      FROM users u
      WHERE u.company_id = $1
        AND u.role = 'EMPLOYER'
      ORDER BY u.created_at ASC
      `,
      [companyId]
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("GET /api/employer/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

// POST — create a new sub-user for this company
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!EmployerPermissions.canManageUsers(sessionUser.employer_role)) {
      return NextResponse.json({ error: "Only company admins can add users." }, { status: 403 });
    }

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const employerRole = String(body.employer_role || "") as EmployerRoleType;

    if (!fullName || !email || !password || !employerRole) {
      return NextResponse.json(
        { error: "Full name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (!["ADMIN", "HR_MANAGER", "HR_STAFF", "READ_ONLY"].includes(employerRole)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check email uniqueness across all users
    const existing = await db.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    // Get company name for the email
    const companyResult = await db.query(
      `SELECT company_name FROM users WHERE id = $1`,
      [companyId]
    );
    const companyName = companyResult.rows[0]?.company_name || BRANDING.shortName;

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
      INSERT INTO users (
        full_name,
        company_name,
        email,
        password_hash,
        role,
        employer_role,
        company_id,
        must_change_password
      )
      VALUES ($1, $2, $3, $4, 'EMPLOYER', $5, $6, TRUE)
      RETURNING id, full_name, email, employer_role, is_active, created_at, company_id
      `,
      [fullName, companyName, email, passwordHash, employerRole, companyId]
    );

    const newUser = result.rows[0];

    // Send welcome email — non-blocking
    const emailTemplate = buildInviteEmail(fullName, email, password, employerRole, companyName);
    resend.emails.send({
      from: "noreply@fortiedgetech.com.au", // Replace with verified domain
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    }).catch((err) => console.error("Failed to send employer user email:", err));

    return NextResponse.json({ user: { ...newUser, is_owner: false } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/employer/users error:", error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}