// app/api/criteria/route.ts  — dipakai wizard Buat Grup (client) untuk menampilkan kriteria terkini.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCriteriaTree, MIN_OPSIONAL } from "@/lib/criteria-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s.user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  const criteria = await getCriteriaTree();
  return NextResponse.json({ criteria, minOpsional: MIN_OPSIONAL });
}
