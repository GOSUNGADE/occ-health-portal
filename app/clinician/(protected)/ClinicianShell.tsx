import AppShell from "@/components/AppShell";
import { PORTAL_LABELS } from "@/lib/branding";

export default function ClinicianShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    email: string;
  };
}) {
  return (
    <AppShell
      portalLabel={PORTAL_LABELS.clinician}
      user={user}
      navItems={[
        { href: "/clinician/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/clinician/bookings", label: "My Bookings", icon: "📅" },
      ]}
      logoutAction="/api/clinician/logout"
    >
      {children}
    </AppShell>
  );
}