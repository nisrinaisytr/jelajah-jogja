// app/api/admin/criteria/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCriteriaTree, nextCriteriaKey } from "@/lib/criteria-store";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  return NextResponse.json({ criteria: await getCriteriaTree() });
}

const schema = z.object({ nama: z.string().min(2).max(120), deskripsi: z.string().optional(), wajib: z.coerce.boolean().default(false) });

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Nama kriteria minimal 2 karakter" }, { status: 400 });
  const all = await prisma.criteria.findMany({ select: { key: true } });
  const key = nextCriteriaKey(all.map((c) => c.key));
  const maxU = await prisma.criteria.aggregate({ _max: { urutan: true } });
  await prisma.criteria.create({
    data: {
      key, nama: p.data.nama, deskripsi: p.data.deskripsi || null, wajib: p.data.wajib, urutan: (maxU._max.urutan ?? 0) + 1,
      // kriteria baru otomatis punya 2 subkriteria awal agar BWM level-2 valid (admin bisa rename/tambah)
      subKriteria: { create: [{ key: `${key}_S1`, nama: "Aspek 1", urutan: 0 }, { key: `${key}_S2`, nama: "Aspek 2", urutan: 1 }] },
    },
  });
  return NextResponse.json({ ok: true, key });
}
