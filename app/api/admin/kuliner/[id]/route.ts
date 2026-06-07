// app/api/admin/kuliner/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }

const schema = z.object({
  nama: z.string().min(1).optional(), jenis: z.string().min(1).optional(), alamat: z.string().min(1).optional(),
  latitude: z.coerce.number().optional(), longitude: z.coerce.number().optional(),
  hargaRataRata: z.coerce.number().int().min(0).optional(), rating: z.coerce.number().min(0).max(5).optional(),
  imageUrl: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const d: any = { ...p.data };
  if (d.imageUrl !== undefined) d.imageUrl = d.imageUrl || null;
  await prisma.kuliner.update({ where: { id: Number(params.id) }, data: d });
  return NextResponse.json({ ok: true });
}
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  try { await prisma.kuliner.delete({ where: { id: Number(params.id) } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 }); }
}
