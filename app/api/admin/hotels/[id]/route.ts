// app/api/admin/hotels/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }
const toJson = (csv?: string) => JSON.stringify((csv ?? "").split(",").map((s) => s.trim()).filter(Boolean));

const schema = z.object({
  nama: z.string().min(1).optional(), alamat: z.string().min(1).optional(), wilayah: z.string().min(1).optional(),
  latitude: z.coerce.number().optional(), longitude: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(5).optional(), hargaPerMalam: z.coerce.number().int().min(0).optional(),
  tier: z.enum(["BUDGET", "STANDARD", "PREMIUM"]).optional(),
  fasilitas: z.string().optional(), imageUrl: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const d: any = { ...p.data };
  if (d.fasilitas !== undefined) d.fasilitas = toJson(d.fasilitas);
  if (d.imageUrl !== undefined) d.imageUrl = d.imageUrl || null;
  await prisma.hotel.update({ where: { id: Number(params.id) }, data: d });
  return NextResponse.json({ ok: true });
}
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  try { await prisma.hotel.delete({ where: { id: Number(params.id) } }); return NextResponse.json({ ok: true }); }
  catch (e: any) {
    if (e?.code === "P2003") return NextResponse.json({ error: "Hotel tidak bisa dihapus karena sudah dipakai di paket wisata." }, { status: 400 });
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
