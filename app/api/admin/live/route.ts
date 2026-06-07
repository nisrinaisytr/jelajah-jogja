// app/api/admin/live/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLiveGroupStats, getLiveGroups } from "@/lib/analytics-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const u = session.user;
  if (!u || (u.role !== "OWNER" && u.role !== "STAFF")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  const [stats, groups] = await Promise.all([getLiveGroupStats(), getLiveGroups()]);
  return NextResponse.json({ stats, groups });
}
