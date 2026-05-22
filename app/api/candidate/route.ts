import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { BRANDING } from "@/lib/branding";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getInviteExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

function buildInviteEmail(candidateName: string, inviteLink: string) {
  return {
    subject: `You've been invited to ${BRANDING.shortName} Occupational Health Portal`,
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
                    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#101828;">Hi ${candidateName},</h1>
                    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">
                      You've been invited to complete your occupational health assessment through the
                      <strong>${BRANDING.shortName}</strong> portal. Please register your account using
                      the button below to get started.
                    </p>
                    <p style="margin:0 0 8px;font-size:14px;color:#64748b;">
                      Your invite link expires in <strong>7 days</strong>.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                      <tr>
                        <td style="background:#119ee8;border-radius:14px;">
                          <a href="${inviteLink}"
                             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                            Register your account →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin:0;font-size:12px;color:#119ee8;word-break:break-all;">
                      ${inviteLink}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e9eef5;border-top:none;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">
                      If you weren't expecting this invitation, you can safely ignore this email.
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

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await db.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        date_of_birth,
        notes,
        linked_user_id,
        created_at,
        updated_at
      FROM candidates
      WHERE employer_id = $1
      ORDER BY created_at DESC
      `,
      [sessionUser.id]
    );

    return NextResponse.json({ candidates: result.rows });
  } catch (error) {
    console.error("GET /api/candidates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const client = await db.connect();

  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const fullName = body.full_name?.trim();
    const email = body.email?.trim().toLowerCase() || null;
    const phone = body.phone?.trim() || null;
    const dateOfBirth = body.date_of_birth?.trim() || null;
    const notes = body.notes?.trim() || null;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Candidate email is required for invitation" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const candidateResult = await client.query(
      `
      INSERT INTO candidates (
        employer_id,
        full_name,
        email,
        phone,
        date_of_birth,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        employer_id,
        full_name,
        email,
        phone,
        date_of_birth,
        notes,
        linked_user_id,
        created_at,
        updated_at
      `,
      [sessionUser.id, fullName, email, phone, dateOfBirth, notes]
    );

    const candidate = candidateResult.rows[0];

    const token = generateInviteToken();
    const expiresAt = getInviteExpiryDate();

    await client.query(
      `
      INSERT INTO candidate_invites (
        candidate_id,
        email,
        token,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      `,
      [candidate.id, email, token, expiresAt]
    );

    await client.query("COMMIT");

    const inviteLink = `${req.nextUrl.origin}/candidate/register?token=${token}`;

    // Send invite email — non-blocking so a mail failure doesn't break the response
    const emailTemplate = buildInviteEmail(fullName, inviteLink);
    resend.emails.send({
      from: "noreply@fortiedgetech.com.au", // Replace with your verified domain e.g. "noreply@primomedical.com.au"
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    }).catch((err) => {
      console.error("Failed to send invite email:", err);
    });

    return NextResponse.json(
      {
        message: "Candidate created and invite sent successfully",
        candidate,
        inviteLink,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/candidates error:", error);
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
