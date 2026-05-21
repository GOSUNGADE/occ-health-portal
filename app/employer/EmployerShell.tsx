"use client";

import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { PORTAL_LABELS } from "@/lib/branding";

type EmployerShellProps = {
  user: {
    email: string;
  };
  children: ReactNode;
};

const navItems = [
  { href: "/employer/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/employer/candidates", label: "Candidates", icon: "👥" },
  { href: "/employer/bookings", label: "Bookings", icon: "🗓" },
  { href: "/employer/users", label: "Users", icon: "👤" },
  { href: "/employer/forms", label: "Forms", icon: "🗂" },
];

export default function EmployerShell({
  user,
  children,
}: EmployerShellProps) {
  return (
    <AppShell
      portalLabel={PORTAL_LABELS.employer}
      user={user}
      navItems={navItems}
      logoutAction="/api/logout"
    >
      {children}
    </AppShell>
  );
}