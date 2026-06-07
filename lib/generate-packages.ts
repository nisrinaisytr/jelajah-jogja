// lib/generate-packages.ts
// Auto-Generate 3 Paket Wisata (Hemat/Standard/Premium) dari hasil TOPSIS.
// Algoritma: clustering wilayah -> assignment per hari (slot PAGI/SIANG/SORE) -> rute Haversine -> hotel terdekat (centroid).
import { prisma } from "@/lib/prisma";
import { haversine } from "@/lib/route-optimizer";

// Konstanta harga (asumsi; bisa disesuaikan)
const TRANSPORT_PER_HARI = 75000; // /orang/hari (share bus)
const GUIDE_PER_HARI = 25000;     // /orang/hari
const SLOT_JAM = ["08:00-11:00", "12:00-15:00", "15:30-18:00"];

interface Dest {
  id: number; nama: string; wilayah: string; hargaTiket: number;
  latitude: number; longitude: number; waktuKunjunganIdeal: string;
}

function avg(nums: number[]) { return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; }

export async function generateThreePackages(groupId: number) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Grup tidak ditemukan");
  const durasi = group.durasiTour;

  // 1) Kandidat = Top (durasi*3) dari TOPSIS
  const topsis = await prisma.groupTopsisResult.findMany({
    where: { groupId },
    orderBy: { ranking: "asc" },
    take: durasi * 3,
    include: { destination: true },
  });
  const candidates: Dest[] = topsis.map((t) => ({
    id: t.destination.id, nama: t.destination.nama, wilayah: t.destination.wilayah,
    hargaTiket: t.destination.hargaTiket, latitude: t.destination.latitude, longitude: t.destination.longitude,
    waktuKunjunganIdeal: t.destination.waktuKunjunganIdeal,
  }));
  if (candidates.length === 0) throw new Error("Belum ada hasil TOPSIS");

  // 2) Clustering per wilayah, urut by jumlah (desc)
  const byWilayah = new Map<string, Dest[]>();
  for (const d of candidates) {
    if (!byWilayah.has(d.wilayah)) byWilayah.set(d.wilayah, []);
    byWilayah.get(d.wilayah)!.push(d);
  }
  const wilayahSorted = [...byWilayah.entries()].sort((a, b) => b[1].length - a[1].length).map((e) => e[1]);

  // 3) Assignment per hari + urutan slot PAGI -> SIANG -> SORE
  const itinerary: { hari: number; destinations: Dest[] }[] = [];
  for (let day = 1; day <= durasi; day++) {
    const pool = wilayahSorted[day - 1] && wilayahSorted[day - 1].length > 0 ? wilayahSorted[day - 1] : wilayahSorted.find((w) => w.length > 0) ?? [];
    const destinasiHariIni: Dest[] = pool.splice(0, 3);
    // lengkapi sampai 3 dari wilayah lain (kalau kurang)
    while (destinasiHariIni.length < 3) {
      const next = wilayahSorted.find((w) => w.length > 0);
      if (!next) break;
      destinasiHariIni.push(next.shift()!);
    }
    // urut waktu
    const pagi = destinasiHariIni.filter((d) => d.waktuKunjunganIdeal === "PAGI");
    const siang = destinasiHariIni.filter((d) => d.waktuKunjunganIdeal === "SIANG");
    const sore = destinasiHariIni.filter((d) => d.waktuKunjunganIdeal === "SORE");
    const sisa = destinasiHariIni.filter((d) => !["PAGI", "SIANG", "SORE"].includes(d.waktuKunjunganIdeal));
    const ordered = [pagi[0], siang[0], sore[0]].filter(Boolean) as Dest[];
    // isi slot kosong dengan sisa (MALAM/FLEKSIBEL) atau kelebihan slot
    for (const d of [...sisa, ...pagi.slice(1), ...siang.slice(1), ...sore.slice(1)]) {
      if (ordered.length >= 3) break;
      if (!ordered.includes(d)) ordered.push(d);
    }
    if (ordered.length) itinerary.push({ hari: day, destinations: ordered });
  }

  const allDest = itinerary.flatMap((d) => d.destinations);
  if (allDest.length === 0) throw new Error("Tidak ada destinasi untuk dijadwalkan");

  // 4) Hotel terdekat dari centroid, per tier
  const centroidLat = avg(allDest.map((d) => d.latitude));
  const centroidLng = avg(allDest.map((d) => d.longitude));
  const allHotels = await prisma.hotel.findMany();
  function nearestHotel(tier: string) {
    const pool = allHotels.filter((h) => h.tier === tier);
    const src = pool.length ? pool : allHotels; // fallback kalau tier kosong
    return src.map((h) => ({ h, dist: haversine(centroidLat, centroidLng, h.latitude, h.longitude) }))
      .sort((a, b) => a.dist - b.dist)[0]?.h;
  }

  // 5) Base price = tiket semua destinasi + transport + guide (per orang)
  const tiketTotal = allDest.reduce((s, d) => s + d.hargaTiket, 0);
  const basePrice = tiketTotal + (TRANSPORT_PER_HARI + GUIDE_PER_HARI) * durasi;

  const variants = [
    { variant: "HEMAT" as const, tier: "BUDGET", label: "Hemat", mult: 1.0, armada: "Bus Ekonomi 35 Seat" },
    { variant: "STANDARD" as const, tier: "STANDARD", label: "Standard", mult: 1.5, armada: "Bus AC 35 Seat" },
    { variant: "PREMIUM" as const, tier: "PREMIUM", label: "Premium", mult: 2.5, armada: "Minibus Premium 15 Seat" },
  ];
  const durasiLabel = durasi === 1 ? "1 Hari" : `${durasi}D${durasi - 1}N`;

  // 6) Bersihkan paket lama lalu generate
  await prisma.tourPackage.deleteMany({ where: { groupId } }); // cascade hapus detail

  for (const v of variants) {
    const hotel = nearestHotel(v.tier);
    if (!hotel) continue;
    const hargaPerOrang = Math.round((basePrice + hotel.hargaPerMalam * Math.max(durasi - 1, 0)) * v.mult);

    const pkg = await prisma.tourPackage.create({
      data: {
        groupId,
        variant: v.variant,
        namaPaket: `Paket ${v.label} ${durasiLabel}`,
        hargaPerOrang,
        durasiHari: durasi,
        jenisArmada: v.armada,
        hotelId: hotel.id,
      },
    });

    // 7) Detail itinerary + jarak Haversine berurutan (mulai dari hotel)
    const detailRows: any[] = [];
    for (const day of itinerary) {
      let prevLat = hotel.latitude, prevLng = hotel.longitude;
      day.destinations.forEach((d, i) => {
        const jarak = Math.round(haversine(prevLat, prevLng, d.latitude, d.longitude) * 100) / 100;
        detailRows.push({
          tourPackageId: pkg.id,
          destinationId: d.id,
          hariKe: day.hari,
          urutanRute: i + 1,
          waktuKunjungan: d.waktuKunjunganIdeal,
          estimasiJam: SLOT_JAM[i] ?? SLOT_JAM[SLOT_JAM.length - 1],
          jarakDariSebelum: jarak,
        });
        prevLat = d.latitude; prevLng = d.longitude;
      });
    }
    await prisma.tourPackageDetail.createMany({ data: detailRows });
  }

  const count = await prisma.tourPackage.count({ where: { groupId } });
  return { packages: count, destinations: allDest.length };
}

// Step 7: rekomendasi kuliner terdekat (dipakai di halaman hasil / Tahap 9)
export async function getKulinerForPackage(tourPackageId: number) {
  const details = await prisma.tourPackageDetail.findMany({
    where: { tourPackageId },
    include: { destination: { select: { latitude: true, longitude: true } } },
  });
  if (details.length === 0) return [];
  const cLat = avg(details.map((d) => d.destination.latitude));
  const cLng = avg(details.map((d) => d.destination.longitude));
  const all = await prisma.kuliner.findMany();
  return all
    .map((k) => ({ k, dist: haversine(cLat, cLng, k.latitude, k.longitude) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map((x) => x.k);
}
