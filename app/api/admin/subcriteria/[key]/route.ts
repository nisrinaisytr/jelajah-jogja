// app/api/admin/subcriteria/[key]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }

const schema = z.object({ nama: z.string().min(2).max(120) });

export async function PATCH(req: Request, { params }: { params: { key: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Nama subkriteria minimal 2 karakter" }, { status: 400 });
  await prisma.subCriteria.update({ where: { key: params.key }, data: { nama: p.data.nama } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { key: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const sub = await prisma.subCriteria.findUnique({ where: { key: params.key } });
  if (!sub) return NextResponse.json({ error: "Subkriteria tidak ditemukan" }, { status: 404 });
  const siblings = await prisma.subCriteria.count({ where: { criteriaKey: sub.criteriaKey } });
  if (siblings <= 2) return NextResponse.json({ error: "Tiap kriteria minimal punya 2 subkriteria (untuk perbandingan BWM)." }, { status: 400 });
  await prisma.$transaction([
    prisma.destinationScore.deleteMany({ where: { subCriteriaKey: params.key } }),
    prisma.userCriteriaWeight.deleteMany({ where: { kriteriaKey: params.key, level: "SUBCRITERIA" } }),
    prisma.groupCriteriaWeight.deleteMany({ where: { kriteriaKey: params.key, level: "SUBCRITERIA" } }),
    prisma.subCriteria.delete({ where: { key: params.key } }),
  ]);
  return NextResponse.json({ ok: true });
}
