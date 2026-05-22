import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { BRANDING } from "@/lib/branding";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const userResult = await db.query(
      `SELECT id, full_name, email, is_active FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return NextResponse.json({
        message: "If an account exists with that email, a reset link has been sent.",
      });
    }

    const user = userResult.rows[0];

    // Expire any existing unused tokens for this user
    await db.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    // Create new token — expires in 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
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
                <tr>
                  <td style="background:#ffffff;padding:36px;border-left:1px solid #e9eef5;border-right:1px solid #e9eef5;">
                    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#101828;">Reset your password</h1>
                    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">
                      Hi ${user.full_name}, we received a request to reset your password.
                      Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                      <tr>
                        <td style="background:#119ee8;border-radius:14px;">
                          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                            Reset password →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Or copy and paste this link:</p>
                    <p style="margin:0;font-size:12px;color:#119ee8;word-break:break-all;">${resetUrl}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e9eef5;border-top:none;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">
                      If you didn't request a password reset, you can safely ignore this email.
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
    `;

    await resend.emails.send({
      from: "noreply@fortiedgetech.com.au", // Replace with your verified domain
      to: email,
      subject: `Reset your ${BRANDING.shortName} password`,
      html,
    });

    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}