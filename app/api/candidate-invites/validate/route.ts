import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      SELECT
        ci.id,
        ci.candidate_id,
        ci.email AS invite_email,
        ci.token,
        ci.expires_at,
        ci.used_at,
        c.full_name,
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

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    const invite = result.rows[0];

    if (invite.used_at) {
      return NextResponse.json(
        { error: "This invite link has already been used" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(invite.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      return NextResponse.json(
        { error: "This invite link has expired" },
        { status: 400 }
      );
    }

    if (invite.linked_user_id) {
      return NextResponse.json(
        { error: "Candidate account has already been registered" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      candidate: {
        id: invite.candidate_id,
        full_name: invite.full_name,
        email: invite.candidate_email || invite.invite_email,
      },
    });
  } catch (error) {
    console.error("GET /api/candidate-invites/validate error:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}