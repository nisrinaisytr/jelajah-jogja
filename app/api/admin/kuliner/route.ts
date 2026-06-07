// app/api/admin/kuliner/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }
const normalize = (k: any) => ({ id: k.id, nama: k.nama, jenis: k.jenis, alamat: k.alamat, latitude: k.latitude, longitude: k.longitude, hargaRataRata: k.hargaRataRata, rating: k.rating, imageUrl: k.imageUrl ?? "" });

const schema = z.object({
  nama: z.string().min(1), jenis: z.string().min(1), alamat: z.string().min(1),
  latitude: z.coerce.number(), longitude: z.coerce.number(),
  hargaRataRata: z.coerce.number().int().min(0), rating: z.coerce.number().min(0).max(5),
  imageUrl: z.string().optional().default(""),
});

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const rows = await prisma.kuliner.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json({ rows: rows.map(normalize) });
}
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid: " + p.error.issues[0]?.message }, { status: 400 });
  const d = p.data;
  const k = await prisma.kuliner.create({ data: { nama: d.nama, jenis: d.jenis, alamat: d.alamat, latitude: d.latitude, longitude: d.longitude, hargaRataRata: d.hargaRataRata, rating: d.rating, imageUrl: d.imageUrl || null } });
  return NextResponse.json({ ok: true, row: normalize(k) });
}
