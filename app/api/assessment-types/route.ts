import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = sessionUser.company_id ?? sessionUser.id;

    // Fetch all active packages available to this employer
    // (global ones where employer_id IS NULL + their own custom ones)
    const packagesResult = await db.query(
      `
      SELECT
        at.id,
        at.name,
        at.description,
        at.industry,
        at.duration_minutes,
        at.base_price,
        at.employer_id
      FROM assessment_types at
      WHERE at.is_active = TRUE
        AND (at.employer_id IS NULL OR at.employer_id = $1)
      ORDER BY at.industry, at.name
      `,
      [companyId]
    );

    const packages = packagesResult.rows;

    if (packages.length === 0) {
      return NextResponse.json({ assessment_types: [] });
    }

    // Fetch all tests linked to these packages
    const packageIds = packages.map((p) => p.id);

    const testsResult = await db.query(
      `
      SELECT
        att.assessment_type_id,
        t.id,
        t.name,
        t.category,
        t.description,
        t.requires_fasting,
        t.requires_referral
      FROM assessment_type_tests att
      JOIN assessment_tests t ON t.id = att.assessment_test_id
      WHERE att.assessment_type_id = ANY($1)
      ORDER BY t.category, t.name
      `,
      [packageIds]
    );

    // Group tests by package
    const testsByPackage: Record<number, typeof testsResult.rows> = {};
    for (const test of testsResult.rows) {
      if (!testsByPackage[test.assessment_type_id]) {
        testsByPackage[test.assessment_type_id] = [];
      }
      testsByPackage[test.assessment_type_id].push(test);
    }

    // Attach tests to each package
    const result = packages.map((pkg) => ({
      ...pkg,
      tests: testsByPackage[pkg.id] || [],
    }));

    return NextResponse.json({ assessment_types: result });
  } catch (error) {
    console.error("GET /api/assessment-types error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment types." },
      { status: 500 }
    );
  }
}