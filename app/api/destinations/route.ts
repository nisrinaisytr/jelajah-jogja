// app/api/destinations/route.ts
// GET daftar destinasi dengan filter + paginasi untuk halaman Eksplorasi.
// Query params: search, kategori, wilayah (csv), harga (csv band id), rating, aksesBus, bolehDrone, page
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HARGA_BANDS } from "@/lib/destinasi-helpers";

const PAGE_SIZE = 9; // grid 3 kolom x 3 baris

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const kategori = searchParams.get("kategori") ?? "";
    const wilayahCsv = searchParams.get("wilayah") ?? "";
    const hargaCsv = searchParams.get("harga") ?? "";
    const rating = parseFloat(searchParams.get("rating") ?? "0");
    const aksesBus = searchParams.get("aksesBus") === "1";
    const bolehDrone = searchParams.get("bolehDrone") === "1";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const where: any = {};

    if (search) where.nama = { contains: search };
    if (kategori && kategori !== "Semua") where.kategori = kategori;

    const wilayah = wilayahCsv.split(",").map((w) => w.trim()).filter(Boolean);
    if (wilayah.length) where.wilayah = { in: wilayah };

    if (rating > 0) where.rating = { gte: rating };
    if (aksesBus) where.aksesBus = true;
    if (bolehDrone) where.bolehDrone = true;

    // harga: gabungan beberapa band -> OR rentang
    const bandIds = hargaCsv.split(",").map((b) => b.trim()).filter(Boolean);
    if (bandIds.length) {
      where.OR = bandIds
        .map((id) => HARGA_BANDS.find((b) => b.id === id))
        .filter(Boolean)
        .map((b) => ({ hargaTiket: { gte: b!.min, lte: b!.max } }));
    }

    const [total, items] = await Promise.all([
      prisma.destination.count({ where }),
      prisma.destination.findMany({
        where,
        orderBy: { rating: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, nama: true, kategori: true, wilayah: true,
          hargaTiket: true, rating: true, imageUrl: true, jarakPusat: true,
        },
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (e) {
    console.error("destinations api error:", e);
    return NextResponse.json({ error: "Gagal memuat destinasi" }, { status: 500 });
  }
}
