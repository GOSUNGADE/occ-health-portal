import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set in .env");
}

const secret = new TextEncoder().encode(jwtSecret);

type SessionUser = {
  id: number;
  email: string;
  role: "ADMIN" | "EMPLOYER" | "CLINICIAN" | "CANDIDATE";
  must_change_password: boolean;
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const pathname = req.nextUrl.pathname;

  const isEmployerRoute = pathname.startsWith("/employer");
  const isAdminRoute = pathname.startsWith("/admin");
  const isClinicianRoute = pathname.startsWith("/clinician");
  const isCandidateRoute = pathname.startsWith("/candidate");

  const isCandidateRegisterPage = pathname === "/candidate/register";
  const isCandidateProtectedRoute = isCandidateRoute && !isCandidateRegisterPage;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const isAdminChangePassword = pathname === "/admin/change-password";
  const isClinicianChangePassword = pathname === "/clinician/change-password";

  const isChangePasswordApi = pathname === "/api/auth/change-password";

  let session: SessionUser | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);

      const id =
        typeof payload.id === "number"
          ? payload.id
          : typeof payload.id === "string"
            ? Number(payload.id)
            : NaN;

      if (
        Number.isFinite(id) &&
        typeof payload.email === "string" &&
        typeof payload.role === "string" &&
        typeof payload.must_change_password === "boolean" &&
        ["ADMIN", "EMPLOYER", "CLINICIAN", "CANDIDATE"].includes(payload.role)
      ) {
        session = {
          id,
          email: payload.email,
          role: payload.role as
            | "ADMIN"
            | "EMPLOYER"
            | "CLINICIAN"
            | "CANDIDATE",
          must_change_password: payload.must_change_password,
        };
      }
    } catch {
      session = null;
    }
  }

  if (!session) {
    if (
      isEmployerRoute ||
      isAdminRoute ||
      isClinicianRoute ||
      isCandidateProtectedRoute
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  if (session.must_change_password) {
    if (session.role === "ADMIN") {
      if (
        isAdminChangePassword ||
        isChangePasswordApi ||
        pathname === "/api/logout"
      ) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/admin/change-password", req.url));
    }

    if (session.role === "CLINICIAN") {
      if (
        isClinicianChangePassword ||
        isChangePasswordApi ||
        pathname === "/api/logout"
      ) {
        return NextResponse.next();
      }

      return NextResponse.redirect(
        new URL("/clinician/change-password", req.url)
      );
    }
  }

  if (isEmployerRoute && session.role !== "EMPLOYER") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isClinicianRoute && session.role !== "CLINICIAN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isCandidateProtectedRoute && session.role !== "CANDIDATE") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage) {
    if (session.role === "EMPLOYER") {
      return NextResponse.redirect(new URL("/employer/dashboard", req.url));
    }

    if (session.role === "ADMIN") {
      return NextResponse.redirect(
        new URL(
          session.must_change_password
            ? "/admin/change-password"
            : "/admin/dashboard",
          req.url
        )
      );
    }

    if (session.role === "CLINICIAN") {
      return NextResponse.redirect(
        new URL(
          session.must_change_password
            ? "/clinician/change-password"
            : "/clinician/dashboard",
          req.url
        )
      );
    }

    if (session.role === "CANDIDATE") {
      return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
    }
  }

  if (isCandidateRegisterPage && session.role === "CANDIDATE") {
    return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/change-password",
    "/clinician/change-password",
    "/employer/:path*",
    "/admin/:path*",
    "/clinician/:path*",
    "/candidate/:path*",
    "/api/auth/change-password",
  ],
};