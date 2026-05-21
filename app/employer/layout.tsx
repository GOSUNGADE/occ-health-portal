import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import EmployerShell from "./EmployerShell";

export default async function EmployerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "EMPLOYER") {
    redirect("/login");
  }

  return (
    <EmployerShell
      user={{
        email: user.email,
      }}
    >
      {children}
    </EmployerShell>
  );
}
