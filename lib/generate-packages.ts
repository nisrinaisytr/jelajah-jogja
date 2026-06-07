// lib/generate-packages.ts
// Auto-Generate 3 OPSI ITINERARY berbeda (Paket A/B/C) dari hasil TOPSIS.
// Filosofi: tiap paket = satu JALUR wisata yang koheren (dikelompokkan per wilayah),
// memakai kelas hotel & armada yang SAMA agar HARGA SEPADAN. Pembedanya = pilihan destinasi/rute,
// bukan kelas harga. (Sebelumnya: Hemat/Standard/Premium berbasis harga — diganti.)
import { prisma } from "@/lib/prisma";
import { haversine } from "@/lib/route-optimizer";

const TRANSPORT_PER_HARI = 75000;
const GUIDE_PER_HARI = 25000;
const SLOT_JAM = ["08:00-11:00", "12:00-15:00", "15:30-18:00"];
const VARIANT = ["HEMAT", "STANDARD", "PREMIUM"] as const; // dipakai sbg ID internal Paket A/B/C
const LETTER = ["A", "B", "C"];

interface Dest {
  id: number; nama: string; wilayah: string; hargaTiket: number;
  latitude: number; longitude: number; waktuKunjunganIdeal: string;
  ciScore: number; ranking: number;
}
function avg(n: number[]) { return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0; }

function scheduleDays(dests: Dest[], durasi: number) {
  const days: { hari: number; destinations: Dest[] }[] = [];
  const pool = [...dests];
  for (let day = 1; day <= durasi; day++) {
    const dh = pool.splice(0, 3);
    if (dh.length === 0) break;
    const pagi = dh.filter((d) => d.waktuKunjunganIdeal === "PAGI");
    const siang = dh.filter((d) => d.waktuKunjunganIdeal === "SIANG");
    const sore = dh.filter((d) => d.waktuKunjunganIdeal === "SORE");
    const sisa = dh.filter((d) => !["PAGI", "SIANG", "SORE"].includes(d.waktuKunjunganIdeal));
    const ordered = [pagi[0], siang[0], sore[0]].filter(Boolean) as Dest[];
    for (const d of [...sisa, ...pagi.slice(1), ...siang.slice(1), ...sore.slice(1)]) {
      if (ordered.length >= 3) break;
      if (!ordered.includes(d)) ordered.push(d);
    }
    if (ordered.length) days.push({ hari: day, destinations: ordered });
  }
  return days;
}

export async function generateThreePackages(groupId: number) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Grup tidak ditemukan");
  const durasi = group.durasiTour;
  const perPkg = durasi * 3;

  // Kandidat: ambil lebih banyak agar 3 opsi bisa berbeda
  const poolSize = Math.min(75, perPkg * 4 + 3);
  const topsis = await prisma.groupTopsisResult.findMany({
    where: { groupId }, orderBy: { ranking: "asc" }, take: poolSize, include: { destination: true },
  });
  const cands: Dest[] = topsis.map((t) => ({
    id: t.destination.id, nama: t.destination.nama, wilayah: t.destination.wilayah, hargaTiket: t.destination.hargaTiket,
    latitude: t.destination.latitude, longitude: t.destination.longitude, waktuKunjunganIdeal: t.destination.waktuKunjunganIdeal,
    ciScore: t.ciScore, ranking: t.ranking,
  }));
  if (cands.length === 0) throw new Error("Belum ada hasil TOPSIS");

  // Cluster per wilayah, urut by total skor TOPSIS
  const byW = new Map<string, Dest[]>();
  for (const d of cands) { if (!byW.has(d.wilayah)) byW.set(d.wilayah, []); byW.get(d.wilayah)!.push(d); }
  const clusters = [...byW.entries()]
    .map(([wilayah, ds]) => ({ wilayah, ds, score: ds.reduce((s, x) => s + x.ciScore, 0) }))
    .sort((a, b) => b.score - a.score);

  // Tentukan 3 seed paket
  let seeds: Dest[][];
  if (clusters.length >= 3) {
    seeds = [clusters[0].ds, clusters[1].ds, clusters[2].ds].map((ds) => [...ds]);
  } else {
    // fallback: sebar ranked secara round-robin ke 3 paket
    seeds = [[], [], []];
    [...cands].sort((a, b) => a.ranking - b.ranking).forEach((d, i) => seeds[i % 3].push(d));
  }

  // Susun itinerary tiap paket (usahakan destinasi tidak tumpang tindih antar paket)
  const used = new Set<number>();
  const itineraries: Dest[][] = [];
  for (let p = 0; p < 3; p++) {
    const chosen: Dest[] = [];
    for (const d of [...(seeds[p] ?? [])].sort((a, b) => a.ranking - b.ranking)) {
      if (chosen.length >= perPkg) break;
      if (used.has(d.id)) continue;
      chosen.push(d); used.add(d.id);
    }
    if (chosen.length < perPkg) {
      for (const d of cands.filter((x) => !used.has(x.id)).sort((a, b) => a.ranking - b.ranking)) {
        if (chosen.length >= perPkg) break;
        chosen.push(d); used.add(d.id);
      }
    }
    if (chosen.length < perPkg) { // pool kecil -> boleh reuse
      for (const d of [...cands].sort((a, b) => a.ranking - b.ranking)) {
        if (chosen.length >= perPkg) break;
        if (!chosen.find((x) => x.id === d.id)) chosen.push(d);
      }
    }
    itineraries.push(chosen);
  }

  const hotels = await prisma.hotel.findMany();
  const nearestHotel = (lat: number, lng: number, tier = "STANDARD") => {
    const pool = hotels.filter((h) => h.tier === tier);
    const src = pool.length ? pool : hotels;
    return src.map((h) => ({ h, d: haversine(lat, lng, h.latitude, h.longitude) })).sort((a, b) => a.d - b.d)[0]?.h;
  };

  await prisma.tourPackage.deleteMany({ where: { groupId } });

  let made = 0;
  for (let p = 0; p < 3; p++) {
    const dests = itineraries[p];
    if (!dests || dests.length === 0) continue;
    const days = scheduleDays(dests, durasi);
    const allD = days.flatMap((d) => d.destinations);
    if (allD.length === 0) continue;

    const cLat = avg(allD.map((d) => d.latitude)), cLng = avg(allD.map((d) => d.longitude));
    const hotel = nearestHotel(cLat, cLng, "STANDARD"); // tier SAMA -> harga sepadan
    if (!hotel) continue;

    // Tema = wilayah dominan jalur ini
    const wilCount: Record<string, number> = {};
    allD.forEach((d) => (wilCount[d.wilayah] = (wilCount[d.wilayah] ?? 0) + 1));
    const tema = Object.entries(wilCount).sort((a, b) => b[1] - a[1])[0][0];

    const tiket = allD.reduce((s, d) => s + d.hargaTiket, 0);
    const harga = Math.round(tiket + (TRANSPORT_PER_HARI + GUIDE_PER_HARI) * durasi + hotel.hargaPerMalam * Math.max(durasi - 1, 0));

    const pkg = await prisma.tourPackage.create({
      data: {
        groupId, variant: VARIANT[p], namaPaket: `Paket ${LETTER[p]} · ${tema}`,
        hargaPerOrang: harga, durasiHari: durasi, jenisArmada: "Bus AC 35 Seat", hotelId: hotel.id,
      },
    });

    const rows: any[] = [];
    for (const day of days) {
      let pl = hotel.latitude, pn = hotel.longitude;
      day.destinations.forEach((d, i) => {
        const j = Math.round(haversine(pl, pn, d.latitude, d.longitude) * 100) / 100;
        rows.push({
          tourPackageId: pkg.id, destinationId: d.id, hariKe: day.hari, urutanRute: i + 1,
          waktuKunjungan: d.waktuKunjunganIdeal, estimasiJam: SLOT_JAM[i] ?? SLOT_JAM[SLOT_JAM.length - 1], jarakDariSebelum: j,
        });
        pl = d.latitude; pn = d.longitude;
      });
    }
    await prisma.tourPackageDetail.createMany({ data: rows });
    made++;
  }

  return { packages: made, perPkg };
}

// Rekomendasi kuliner terdekat (dipakai di halaman hasil)
export async function getKulinerForPackage(tourPackageId: number) {
  const details = await prisma.tourPackageDetail.findMany({
    where: { tourPackageId }, include: { destination: { select: { latitude: true, longitude: true } } },
  });
  if (details.length === 0) return [];
  const cLat = avg(details.map((d) => d.destination.latitude));
  const cLng = avg(details.map((d) => d.destination.longitude));
  const all = await prisma.kuliner.findMany();
  return all.map((k) => ({ k, dist: haversine(cLat, cLng, k.latitude, k.longitude) }))
    .sort((a, b) => a.dist - b.dist).slice(0, 3).map((x) => x.k);
}
