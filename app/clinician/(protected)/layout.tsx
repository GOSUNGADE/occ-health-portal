import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ClinicianShell from "./ClinicianShell";

export default async function ClinicianProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/clinician/login");
  }

  if (user.role !== "CLINICIAN") {
    redirect("/");
  }

  return (
    <ClinicianShell user={{ email: user.email }}>
      {children}
    </ClinicianShell>
  );
}