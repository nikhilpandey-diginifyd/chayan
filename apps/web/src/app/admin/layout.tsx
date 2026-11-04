import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(["admin"], "/admin");
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <AdminNav />
      {children}
    </div>
  );
}
