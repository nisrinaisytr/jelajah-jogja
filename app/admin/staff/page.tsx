// app/admin/staff/page.tsx — Manajemen Akun (Owner only)
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccountManager from "@/components/admin/AccountManager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const s = await getSession();
  if (!s.user || s.user.role !== "OWNER") redirect("/admin/dashboard");
  return <AccountManager selfId={s.user.id} />;
}
