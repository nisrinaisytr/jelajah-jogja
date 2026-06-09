// app/admin/branch/page.tsx — Strategic BI
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import StrategicBI from "@/components/admin/StrategicBI";

export const dynamic = "force-dynamic";

export default async function BranchPage() {
  const s = await getSession();
  if (!s.user || s.user.role !== "OWNER") redirect("/admin/dashboard");
  return <StrategicBI />;
}
