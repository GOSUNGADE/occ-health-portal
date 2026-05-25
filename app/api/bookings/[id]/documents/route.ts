import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const bookingCheck = await db.query(
      `SELECT id FROM bookings WHERE id = $1 AND employer_id = $2`,
      [bookingId, companyId]
    );

    if (bookingCheck.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const result = await db.query(
      `
      SELECT id, booking_id, original_name, stored_name, file_url, mime_type, file_size, uploaded_at
      FROM booking_documents
      WHERE booking_id = $1
      ORDER BY uploaded_at DESC
      `,
      [bookingId]
    );

    return NextResponse.json({ documents: result.rows });
  } catch (error) {
    console.error("GET /api/bookings/[id]/documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const bookingCheck = await db.query(
      `SELECT id FROM bookings WHERE id = $1 AND employer_id = $2`,
      [bookingId, companyId]
    );

    if (bookingCheck.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "bookings");
    fs.mkdirSync(uploadDir, { recursive: true });

    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${safeOriginalName}`;
    const filePath = path.join(uploadDir, storedName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/bookings/${storedName}`;

    const result = await db.query(
      `
      INSERT INTO booking_documents (booking_id, original_name, stored_name, file_url, mime_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, booking_id, original_name, stored_name, file_url, mime_type, file_size, uploaded_at
      `,
      [bookingId, file.name, storedName, fileUrl, file.type, file.size]
    );

    return NextResponse.json(
      { message: "Document uploaded successfully", document: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings/[id]/documents error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}