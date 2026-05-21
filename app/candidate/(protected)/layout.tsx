import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { PORTAL_LABELS } from "@/lib/branding";

type CandidateLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/candidate/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/candidate/bookings", label: "Bookings", icon: "🗓" },
  { href: "/candidate/forms", label: "Forms", icon: "🗂" },
];

export default async function CandidateLayout({
  children,
}: CandidateLayoutProps) {
  const user = await getSessionUser();

  if (!user || user.role !== "CANDIDATE") {
    redirect("/login");
  }

  return (
    <AppShell
      portalLabel={PORTAL_LABELS.candidate}
      user={{ email: user.email }}
      navItems={navItems}
      logoutAction="/api/logout"
    >
      {children}
    </AppShell>
  );
}