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
    subject: `Your invite link to ${BRANDING.shortName} Occupational Health Portal`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
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
                      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Occupational Health Portal</p>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;padding:36px;border-left:1px solid #e9eef5;border-right:1px solid #e9eef5;">
                  <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#101828;">Hi ${candidateName},</h1>
                  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">
                    A new invite link has been generated for you to access the <strong>${BRANDING.shortName}</strong> portal.
                  </p>
                  <p style="margin:0 0 8px;font-size:14px;color:#64748b;">This link expires in <strong>7 days</strong>.</p>
                  <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                    <tr>
                      <td style="background:#119ee8;border-radius:14px;">
                        <a href="${inviteLink}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Register your account →</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Or copy and paste this link:</p>
                  <p style="margin:0;font-size:12px;color:#119ee8;word-break:break-all;">${inviteLink}</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;border:1px solid #e9eef5;border-top:none;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;">If you weren't expecting this, you can safely ignore this email.</p>
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const client = await db.connect();

  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const candidateId = Number(id);

    if (Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    await client.query("BEGIN");

    const candidateResult = await client.query(
      `SELECT id, full_name, email, linked_user_id FROM candidates WHERE id = $1 AND employer_id = $2`,
      [candidateId, companyId]
    );

    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const candidate = candidateResult.rows[0];

    if (candidate.linked_user_id) {
      return NextResponse.json({ error: "Candidate already registered" }, { status: 400 });
    }

    await client.query(
      `UPDATE candidate_invites SET used_at = NOW() WHERE candidate_id = $1 AND used_at IS NULL`,
      [candidateId]
    );

    const token = generateInviteToken();
    const expiresAt = getInviteExpiryDate();

    await client.query(
      `INSERT INTO candidate_invites (candidate_id, email, token, expires_at) VALUES ($1, $2, $3, $4)`,
      [candidateId, candidate.email, token, expiresAt]
    );

    await client.query("COMMIT");

    const inviteLink = `${req.nextUrl.origin}/candidate/register?token=${token}`;

    const emailTemplate = buildInviteEmail(candidate.full_name, inviteLink);
    resend.emails.send({
      from: "noreply@fortiedgetech.com.au",
      to: candidate.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    }).catch((err) => console.error("Failed to send invite email:", err));

    return NextResponse.json({ message: "Invite regenerated and email sent successfully", inviteLink });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Regenerate invite error:", error);
    return NextResponse.json({ error: "Failed to regenerate invite" }, { status: 500 });
  } finally {
    client.release();
  }
}