// app/api/admin/hotels/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function guard() {
  const s = await getSession();
  const u = s.user;
  return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null;
}
const toCsv = (j: string | null) => { try { return j ? (JSON.parse(j) as string[]).join(", ") : ""; } catch { return ""; } };
const toJson = (csv?: string) => JSON.stringify((csv ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const normalize = (h: any) => ({ id: h.id, nama: h.nama, alamat: h.alamat, wilayah: h.wilayah, latitude: h.latitude, longitude: h.longitude, rating: h.rating, hargaPerMalam: h.hargaPerMalam, fasilitas: toCsv(h.fasilitas), imageUrl: h.imageUrl ?? "", tier: h.tier });

const schema = z.object({
  nama: z.string().min(1), alamat: z.string().min(1), wilayah: z.string().min(1),
  latitude: z.coerce.number(), longitude: z.coerce.number(),
  rating: z.coerce.number().min(0).max(5), hargaPerMalam: z.coerce.number().int().min(0),
  tier: z.enum(["BUDGET", "STANDARD", "PREMIUM"]),
  fasilitas: z.string().optional().default(""), imageUrl: z.string().optional().default(""),
});

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const hotels = await prisma.hotel.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json({ rows: hotels.map(normalize) });
}
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid: " + p.error.issues[0]?.message }, { status: 400 });
  const d = p.data;
  const h = await prisma.hotel.create({ data: { nama: d.nama, alamat: d.alamat, wilayah: d.wilayah, latitude: d.latitude, longitude: d.longitude, rating: d.rating, hargaPerMalam: d.hargaPerMalam, tier: d.tier, fasilitas: toJson(d.fasilitas), imageUrl: d.imageUrl || null } });
  return NextResponse.json({ ok: true, row: normalize(h) });
}
