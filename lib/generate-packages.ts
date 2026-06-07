// lib/generate-packages.ts
// Auto-Generate 3 OPSI ITINERARY berbeda (Paket A/B/C) dari hasil TOPSIS.
// v3: pengelompokan berbasis JARAK GEOGRAFIS antar destinasi (bukan label wilayah), boleh LINTAS WILAYAH.
//     Urutan kunjungan disusun nearest-neighbor (mempertimbangkan jarak antar destinasi, bukan cuma ke pusat kota).
//     Hotel & armada disamakan -> HARGA SEPADAN. Pembedanya = pilihan destinasi/rute. Nama: "Paket A/B/C" saja.
import { prisma } from "@/lib/prisma";
import { haversine, nearestNeighbor } from "@/lib/route-optimizer";

const TRANSPORT_PER_HARI = 75000;
const GUIDE_PER_HARI = 25000;
const SLOT_JAM = ["08:00-11:00", "12:00-15:00", "15:30-18:00"];
const VARIANT = ["HEMAT", "STANDARD", "PREMIUM"] as const; // ID internal Paket A/B/C
const LETTER = ["A", "B", "C"];

interface Dest {
  id: number; nama: string; wilayah: string; hargaTiket: number;
  latitude: number; longitude: number; waktuKunjunganIdeal: string;
  ciScore: number; ranking: number;
}
const avg = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0);
const dist = (a: Dest, b: Dest) => haversine(a.latitude, a.longitude, b.latitude, b.longitude);

export async function generateThreePackages(groupId: number) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Grup tidak ditemukan");
  const durasi = group.durasiTour;
  const perPkg = durasi * 3;

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

  // 1) SEED 3 anchor secara geografis (farthest-point sampling) agar 3 rute saling berjauhan/berbeda
  const seeds: Dest[] = [cands[0]]; // anchor-1 = TOPSIS teratas
  // anchor-2 = destinasi terjauh dari anchor-1
  let s2: Dest | null = null, s2d = -1;
  for (const d of cands) { const dd = dist(seeds[0], d); if (dd > s2d) { s2d = dd; s2 = d; } }
  if (s2) seeds.push(s2);
  // anchor-3 = maksimalkan jarak minimum ke anchor yang sudah ada
  let s3: Dest | null = null, s3d = -1;
  for (const d of cands) {
    if (seeds.includes(d)) continue;
    const md = Math.min(...seeds.map((s) => dist(s, d)));
    if (md > s3d) { s3d = md; s3 = d; }
  }
  if (s3) seeds.push(s3);
  while (seeds.length < 3) seeds.push(cands[seeds.length % cands.length]); // fallback pool kecil

  // 2) Assign tiap kandidat ke anchor TERDEKAT -> 3 cluster proximity (boleh lintas wilayah)
  const clusters: Dest[][] = [[], [], []];
  for (const d of cands) {
    let bi = 0, bd = Infinity;
    seeds.forEach((s, i) => { const dd = dist(s, d); if (dd < bd) { bd = dd; bi = i; } });
    clusters[bi].push(d);
  }

  // 3) Tiap paket: ambil top (perPkg) by ranking dari clusternya; jika kurang, isi dari kandidat terdekat (belum terpakai)
  const used = new Set<number>();
  const chosenPer: Dest[][] = [];
  for (let p = 0; p < 3; p++) {
    const cl = [...clusters[p]].sort((a, b) => a.ranking - b.ranking);
    const ch: Dest[] = [];
    for (const d of cl) { if (ch.length >= perPkg) break; if (used.has(d.id)) continue; ch.push(d); used.add(d.id); }
    if (ch.length < perPkg) {
      const base = ch.length ? ch : cl;
      const cLat = avg(base.map((d) => d.latitude)), cLng = avg(base.map((d) => d.longitude));
      const rest = cands.filter((d) => !used.has(d.id))
        .sort((a, b) => haversine(cLat, cLng, a.latitude, a.longitude) - haversine(cLat, cLng, b.latitude, b.longitude));
      for (const d of rest) { if (ch.length >= perPkg) break; ch.push(d); used.add(d.id); }
    }
    chosenPer.push(ch);
  }

  const hotels = await prisma.hotel.findMany();
  const nearestHotel = (lat: number, lng: number) => {
    const pool = hotels.filter((h) => h.tier === "STANDARD"); // tier SAMA -> harga sepadan
    const src = pool.length ? pool : hotels;
    return src.map((h) => ({ h, d: haversine(lat, lng, h.latitude, h.longitude) })).sort((a, b) => a.d - b.d)[0]?.h;
  };

  await prisma.tourPackage.deleteMany({ where: { groupId } });

  let made = 0;
  for (let p = 0; p < 3; p++) {
    const dests = chosenPer[p];
    if (!dests || dests.length === 0) continue;

    const cLat = avg(dests.map((d) => d.latitude)), cLng = avg(dests.map((d) => d.longitude));
    const hotel = nearestHotel(cLat, cLng);
    if (!hotel) continue;

    // 4) Urutan rute nearest-neighbor mulai dari hotel -> jarak ANTAR destinasi nyata
    const route = nearestNeighbor({ latitude: hotel.latitude, longitude: hotel.longitude }, dests);

    const tiket = dests.reduce((s, d) => s + d.hargaTiket, 0);
    const harga = Math.round(tiket + (TRANSPORT_PER_HARI + GUIDE_PER_HARI) * durasi + hotel.hargaPerMalam * Math.max(durasi - 1, 0));

    const pkg = await prisma.tourPackage.create({
      data: {
        groupId, variant: VARIANT[p], namaPaket: `Paket ${LETTER[p]}`,
        hargaPerOrang: harga, durasiHari: durasi, jenisArmada: "Bus AC 35 Seat", hotelId: hotel.id,
      },
    });

    // 5) Bagi rute jadi hari (3 stop/hari)
    const rows: any[] = [];
    route.forEach((step, idx) => {
      const hariKe = Math.floor(idx / 3) + 1;
      if (hariKe > durasi) return; // batasi sesuai durasi
      const urutanRute = (idx % 3) + 1;
      rows.push({
        tourPackageId: pkg.id, destinationId: step.dest.id, hariKe, urutanRute,
        waktuKunjungan: step.dest.waktuKunjunganIdeal, estimasiJam: SLOT_JAM[urutanRute - 1] ?? SLOT_JAM[2],
        jarakDariSebelum: step.distance, // km dari titik sebelumnya (hotel utk stop pertama)
      });
    });
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
