// app/api/admin/criteria/[key]/sub/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { nextSubKey } from "@/lib/criteria-store";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }

const schema = z.object({ nama: z.string().min(2).max(120) });

export async function POST(req: Request, { params }: { params: { key: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Nama subkriteria minimal 2 karakter" }, { status: 400 });
  const crit = await prisma.criteria.findUnique({ where: { key: params.key }, include: { subKriteria: true } });
  if (!crit) return NextResponse.json({ error: "Kriteria tidak ditemukan" }, { status: 404 });
  const key = nextSubKey(params.key, crit.subKriteria.map((s) => s.key));
  const maxU = crit.subKriteria.reduce((m, s) => Math.max(m, s.urutan), -1);
  await prisma.subCriteria.create({ data: { key, criteriaKey: params.key, nama: p.data.nama, urutan: maxU + 1 } });
  return NextResponse.json({ ok: true, key });
}
