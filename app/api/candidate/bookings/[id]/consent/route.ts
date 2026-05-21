import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function GET(
  _req: NextRequest,
  context: { params: Params }
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "CANDIDATE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const bookingResult = await db.query(
      `
      SELECT
        b.id,
        c.id AS candidate_id
      FROM bookings b
      INNER JOIN candidates c ON c.id = b.candidate_id
      WHERE b.id = $1
        AND c.linked_user_id = $2
      `,
      [bookingId, sessionUser.id]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const consentResult = await db.query(
      `
      SELECT
        id,
        booking_id,
        candidate_id,
        consent_given,
        full_name,
        signed_at,
        created_at,
        updated_at
      FROM booking_consents
      WHERE booking_id = $1
      `,
      [bookingId]
    );

    return NextResponse.json({
      consent: consentResult.rows[0] ?? null,
    });
  } catch (error) {
    console.error("GET booking consent error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking consent" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Params }
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.role !== "CANDIDATE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const body = await req.json();
    const fullName = String(body.fullName ?? "").trim();
    const consentGiven = body.consentGiven === true;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: "Consent must be accepted" },
        { status: 400 }
      );
    }

    const bookingResult = await db.query(
      `
      SELECT
        b.id,
        c.id AS candidate_id
      FROM bookings b
      INNER JOIN candidates c ON c.id = b.candidate_id
      WHERE b.id = $1
        AND c.linked_user_id = $2
      `,
      [bookingId, sessionUser.id]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const candidateId = bookingResult.rows[0].candidate_id;

    const existingConsent = await db.query(
      `
      SELECT id
      FROM booking_consents
      WHERE booking_id = $1
      `,
      [bookingId]
    );

    if (existingConsent.rows.length > 0) {
      return NextResponse.json(
        { error: "Consent already submitted for this booking" },
        { status: 409 }
      );
    }

    const insertResult = await db.query(
      `
      INSERT INTO booking_consents (
        booking_id,
        candidate_id,
        consent_given,
        full_name,
        signed_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
      RETURNING
        id,
        booking_id,
        candidate_id,
        consent_given,
        full_name,
        signed_at,
        created_at,
        updated_at
      `,
      [bookingId, candidateId, true, fullName]
    );

    return NextResponse.json({
      message: "Consent submitted successfully",
      consent: insertResult.rows[0],
    });
  } catch (error) {
    console.error("POST booking consent error:", error);
    return NextResponse.json(
      { error: "Failed to submit booking consent" },
      { status: 500 }
    );
  }
}