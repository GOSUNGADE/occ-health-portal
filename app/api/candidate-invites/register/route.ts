import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { BRANDING } from "@/lib/branding";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildWelcomeEmail(fullName: string, portalUrl: string) {
  return {
    subject: `You're registered — access your ${BRANDING.shortName} portal`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#0b1220 0%,#11203d 55%,#119ee8 100%);border-radius:20px 20px 0 0;padding:32px 36px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:48px;height:48px;background:#1fb6ff;border-radius:12px;text-align:center;vertical-align:middle;font-size:22px;font-weight:700;color:#fff;">
                          ${BRANDING.logoLetter}
                        </td>
                        <td style="padding-left:14px;">
                          <p style="margin:0;font-size:18px;font-weight:700;color:#fff;">${BRANDING.appName}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Occupational Health Portal</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="background:#ffffff;padding:36px;border-left:1px solid #e9eef5;border-right:1px solid #e9eef5;">

                    <!-- Success badge -->
                    <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:6px 14px;margin-bottom:20px;">
                      <span style="color:#047857;font-size:13px;font-weight:700;">✓ Registration successful</span>
                    </div>

                    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#101828;">
                      Welcome, ${fullName}!
                    </h1>
                    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
                      Your account has been created on the <strong>${BRANDING.shortName}</strong>
                      Occupational Health Portal. You can now access your portal to view your
                      bookings, complete health questionnaires, and track your assessments.
                    </p>

                    <!-- Portal link box -->
                    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;">
                          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your Portal Link</p>
                          <p style="margin:0;font-size:13px;color:#119ee8;word-break:break-all;">
                            <a href="${portalUrl}" style="color:#119ee8;text-decoration:none;">${portalUrl}</a>
                          </p>
                          <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">
                            Bookmark this link so you can always find your way back.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#119ee8;border-radius:14px;">
                          <a href="${portalUrl}"
                             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                            Go to my portal →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e9eef5;border-top:none;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">
                      If you have any questions, please contact your employer or our support team.
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;">
                      © ${new Date().getFullYear()} ${BRANDING.shortName}. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

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
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
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
      `UPDATE candidate_invites SET used_at = NOW() WHERE id = $1`,
      [invite.id]
    );

    await client.query("COMMIT");

    // Build portal URL
    const portalUrl = `${req.nextUrl.origin}/candidate/dashboard`;

    // Send welcome email — non-blocking so it never breaks registration
    const emailTemplate = buildWelcomeEmail(fullName, portalUrl);
    resend.emails.send({
      from: "noreply@fortiedgetech.com.au", // Replace with your verified domain
      to: registrationEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    }).catch((err) => {
      console.error("Failed to send candidate welcome email:", err);
    });

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