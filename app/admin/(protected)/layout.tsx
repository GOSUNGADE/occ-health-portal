import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      user={{
        email: user.email,
      }}
    >
      {children}
    </AdminShell>
  );
}