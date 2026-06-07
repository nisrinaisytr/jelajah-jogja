// app/api/admin/destinations/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }

const arr = (j: string | null) => { try { return j ? (JSON.parse(j) as string[]) : []; } catch { return []; } };
const toCsv = (j: string | null) => arr(j).join(", ");
const toLines = (j: string | null) => arr(j).join("\n");
const fromCsv = (s?: string) => JSON.stringify((s ?? "").split(",").map((x) => x.trim()).filter(Boolean));
const fromLines = (s?: string) => JSON.stringify((s ?? "").split("\n").map((x) => x.trim()).filter(Boolean));

const normalize = (d: any) => ({
  id: d.id, nama: d.nama, kategori: d.kategori, wilayah: d.wilayah, hargaTiket: d.hargaTiket, rating: d.rating,
  imageUrl: d.imageUrl ?? "", deskripsi: d.deskripsi ?? "", deskripsiPanjang: d.deskripsiPanjang ?? "",
  fasilitas: toCsv(d.fasilitas), tipsRombongan: toLines(d.tipsRombongan),
  aksesBus: d.aksesBus, bolehDrone: d.bolehDrone, jarakPusat: d.jarakPusat, kulinerLokal: d.kulinerLokal ?? "",
  latitude: d.latitude, longitude: d.longitude, waktuKunjunganIdeal: d.waktuKunjunganIdeal, durasiKunjungan: d.durasiKunjungan,
  alamatLengkap: d.alamatLengkap, jamBuka: d.jamBuka, jamTutup: d.jamTutup,
});

const schema = z.object({
  nama: z.string().min(1),
  kategori: z.enum(["Alam", "Budaya", "Edukasi", "Petualangan", "Relaksasi"]),
  wilayah: z.string().min(1),
  hargaTiket: z.coerce.number().int().min(0),
  rating: z.coerce.number().min(0).max(5).default(4.5),
  imageUrl: z.string().min(1),
  deskripsi: z.string().optional().default(""),
  deskripsiPanjang: z.string().min(1),
  fasilitas: z.string().optional().default(""),
  tipsRombongan: z.string().optional().default(""),
  aksesBus: z.coerce.boolean().default(false),
  bolehDrone: z.coerce.boolean().default(false),
  jarakPusat: z.coerce.number().min(0),
  kulinerLokal: z.string().optional().default(""),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  waktuKunjunganIdeal: z.enum(["PAGI", "SIANG", "SORE", "MALAM", "FLEKSIBEL"]).default("FLEKSIBEL"),
  durasiKunjungan: z.coerce.number().min(0).default(2),
  alamatLengkap: z.string().min(1),
  jamBuka: z.string().min(1),
  jamTutup: z.string().min(1),
});

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const rows = await prisma.destination.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json({ rows: rows.map(normalize) });
}
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid: " + p.error.issues[0]?.message }, { status: 400 });
  const d = p.data;
  const created = await prisma.destination.create({
    data: {
      nama: d.nama, kategori: d.kategori, wilayah: d.wilayah, hargaTiket: d.hargaTiket, rating: d.rating,
      imageUrl: d.imageUrl, deskripsi: d.deskripsi || null, deskripsiPanjang: d.deskripsiPanjang,
      fasilitas: fromCsv(d.fasilitas), tipsRombongan: fromLines(d.tipsRombongan),
      aksesBus: d.aksesBus, bolehDrone: d.bolehDrone, jarakPusat: d.jarakPusat, kulinerLokal: d.kulinerLokal || null,
      latitude: d.latitude, longitude: d.longitude, waktuKunjunganIdeal: d.waktuKunjunganIdeal, durasiKunjungan: d.durasiKunjungan,
      alamatLengkap: d.alamatLengkap, jamBuka: d.jamBuka, jamTutup: d.jamTutup,
    },
  });
  return NextResponse.json({ ok: true, row: normalize(created) });
}
