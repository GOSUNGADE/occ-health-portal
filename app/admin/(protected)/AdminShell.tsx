"use client";

import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { PORTAL_LABELS } from "@/lib/branding";

type AdminShellProps = {
  user: {
    email: string;
  };
  children: ReactNode;
};

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/admin/users", label: "Users", icon: "👩‍⚕️" },
  { href: "/admin/bookings", label: "Bookings", icon: "📅" },
];

export default function AdminShell({ user, children }: AdminShellProps) {
  return (
    <AppShell
      portalLabel={PORTAL_LABELS.admin}
      user={user}
      navItems={navItems}
      logoutAction="/api/logout"
    >
      {children}
    </AppShell>
  );
}