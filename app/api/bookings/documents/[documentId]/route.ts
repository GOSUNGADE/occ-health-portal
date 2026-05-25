import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { documentId } = await context.params;
    const id = Number(documentId);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    const result = await db.query(
      `
      SELECT bd.id, bd.booking_id, bd.original_name, bd.stored_name, bd.file_url, bd.mime_type, bd.file_size, bd.uploaded_at
      FROM booking_documents bd
      INNER JOIN bookings b ON bd.booking_id = b.id
      WHERE bd.id = $1 AND b.employer_id = $2
      `,
      [id, companyId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = result.rows[0];

    await db.query(`DELETE FROM booking_documents WHERE id = $1`, [id]);

    const cleanedUrl = String(doc.file_url).replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), "public", cleanedUrl);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/bookings/documents/[documentId] error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}