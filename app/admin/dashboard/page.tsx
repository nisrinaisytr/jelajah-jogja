// app/admin/dashboard/page.tsx
import { getLiveGroupStats, getLiveGroups } from "@/lib/analytics-engine";
import LiveTracker from "@/components/admin/LiveTracker";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, groups] = await Promise.all([getLiveGroupStats(), getLiveGroups()]);
  return <LiveTracker initialStats={stats} initialGroups={groups} />;
}
