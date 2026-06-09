// app/api/admin/criteria/[key]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }

const schema = z.object({ nama: z.string().min(2).max(120).optional(), deskripsi: z.string().optional(), wajib: z.coerce.boolean().optional() });

export async function PATCH(req: Request, { params }: { params: { key: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const d: any = { ...p.data };
  if (d.deskripsi !== undefined) d.deskripsi = d.deskripsi || null;
  await prisma.criteria.update({ where: { key: params.key }, data: d });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { key: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const total = await prisma.criteria.count();
  if (total <= 3) return NextResponse.json({ error: "Tidak bisa dihapus: minimal harus tersisa 3 kriteria." }, { status: 400 });
  const crit = await prisma.criteria.findUnique({ where: { key: params.key }, include: { subKriteria: true } });
  if (!crit) return NextResponse.json({ error: "Kriteria tidak ditemukan" }, { status: 404 });
  const subKeys = crit.subKriteria.map((s) => s.key);
  await prisma.$transaction([
    // bersihkan skor & bobot yang merujuk kriteria/subkriteria ini
    prisma.destinationScore.deleteMany({ where: { OR: [{ kriteriaKey: params.key }, { subCriteriaKey: { in: subKeys } }] } }),
    prisma.userCriteriaWeight.deleteMany({ where: { OR: [{ kriteriaKey: params.key }, { parentKriteria: params.key }, { kriteriaKey: { in: subKeys } }] } }),
    prisma.groupCriteriaWeight.deleteMany({ where: { OR: [{ kriteriaKey: params.key }, { parentKriteria: params.key }, { kriteriaKey: { in: subKeys } }] } }),
    prisma.criteria.delete({ where: { key: params.key } }), // SubCriteria ikut terhapus (cascade FK)
  ]);
  return NextResponse.json({ ok: true });
}
