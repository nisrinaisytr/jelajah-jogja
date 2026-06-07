// app/api/admin/destinations/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }
const fromCsv = (s?: string) => JSON.stringify((s ?? "").split(",").map((x) => x.trim()).filter(Boolean));
const fromLines = (s?: string) => JSON.stringify((s ?? "").split("\n").map((x) => x.trim()).filter(Boolean));

const schema = z.object({
  nama: z.string().min(1).optional(),
  kategori: z.enum(["Alam", "Budaya", "Edukasi", "Petualangan", "Relaksasi"]).optional(),
  wilayah: z.string().min(1).optional(),
  hargaTiket: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  imageUrl: z.string().min(1).optional(),
  deskripsi: z.string().optional(), deskripsiPanjang: z.string().min(1).optional(),
  fasilitas: z.string().optional(), tipsRombongan: z.string().optional(),
  aksesBus: z.coerce.boolean().optional(), bolehDrone: z.coerce.boolean().optional(),
  jarakPusat: z.coerce.number().min(0).optional(), kulinerLokal: z.string().optional(),
  latitude: z.coerce.number().optional(), longitude: z.coerce.number().optional(),
  waktuKunjunganIdeal: z.enum(["PAGI", "SIANG", "SORE", "MALAM", "FLEKSIBEL"]).optional(),
  durasiKunjungan: z.coerce.number().min(0).optional(),
  alamatLengkap: z.string().min(1).optional(), jamBuka: z.string().min(1).optional(), jamTutup: z.string().min(1).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const d: any = { ...p.data };
  if (d.fasilitas !== undefined) d.fasilitas = fromCsv(d.fasilitas);
  if (d.tipsRombongan !== undefined) d.tipsRombongan = fromLines(d.tipsRombongan);
  if (d.deskripsi !== undefined) d.deskripsi = d.deskripsi || null;
  if (d.kulinerLokal !== undefined) d.kulinerLokal = d.kulinerLokal || null;
  await prisma.destination.update({ where: { id: Number(params.id) }, data: d });
  return NextResponse.json({ ok: true });
}
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  try {
    await prisma.destination.delete({ where: { id: Number(params.id) } }); // skor ikut terhapus (cascade)
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2003") return NextResponse.json({ error: "Tidak bisa dihapus: destinasi ini sudah dipakai di hasil/paket grup." }, { status: 400 });
    if (e?.code === "P2025") return NextResponse.json({ error: "Destinasi tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
