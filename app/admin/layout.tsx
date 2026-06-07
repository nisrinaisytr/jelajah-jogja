// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const u = session.user;
  if (!u) redirect("/admin-login");
  if (u.role !== "OWNER" && u.role !== "STAFF") redirect("/");

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      <AdminSidebar role={u.role} nama={u.nama} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
