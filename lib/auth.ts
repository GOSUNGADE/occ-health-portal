import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";
const COOKIE_NAME = "session";

export type UserRole = "ADMIN" | "EMPLOYER" | "CLINICIAN" | "CANDIDATE";
export type EmployerRole = "ADMIN" | "HR_MANAGER" | "HR_STAFF" | "READ_ONLY";

export type SessionUser = {
  id: number;
  email: string;
  role: UserRole;
  must_change_password: boolean;
  // Employer sub-user fields
  company_id?: number;       // The owning employer's ID — shared across all sub-users
  employer_role?: EmployerRole; // Sub-role within the company
};

// Permission helpers — use these throughout the app
export const EmployerPermissions = {
  // Can invite/manage other employer sub-users
  canManageUsers: (r?: EmployerRole) => r === "ADMIN",

  // Can create, edit, delete candidates
  canManageCandidates: (r?: EmployerRole) =>
    r === "ADMIN" || r === "HR_MANAGER" || r === "HR_STAFF",

  // Can create and manage bookings
  canManageBookings: (r?: EmployerRole) =>
    r === "ADMIN" || r === "HR_MANAGER" || r === "HR_STAFF",

  // Can view candidates and bookings (all roles)
  canView: (_r?: EmployerRole) => true,

  // Only ADMIN can access settings (billing, company profile etc.)
  canAccessSettings: (r?: EmployerRole) => r === "ADMIN",
} as const;

export function createSessionToken(user: SessionUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;

    if (
      decoded.role !== "ADMIN" &&
      decoded.role !== "EMPLOYER" &&
      decoded.role !== "CLINICIAN" &&
      decoded.role !== "CANDIDATE"
    ) {
      return null;
    }

    if (typeof decoded.must_change_password !== "boolean") {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}