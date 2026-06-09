// lib/strategic-analytics.ts
// Agregasi untuk Strategic BI (Owner). Memakai UserCriteriaWeight.computedWeight (bobot BWM),
// BUKAN skor mentah. Semua fungsi mengembalikan data siap-render (serializable).
import { prisma } from "@/lib/prisma";
import { getCriteriaTree } from "@/lib/criteria-store";

// Koordinat kota (sinkron dgn DAFTAR_KOTA pada lib/extract-kota.ts) untuk peta Leaflet.
export const KOTA_COORD: Record<string, [number, number]> = {
  Jakarta: [-6.2, 106.8], Bandung: [-6.9, 107.6], Surabaya: [-7.25, 112.75], Solo: [-7.57, 110.83],
  Yogyakarta: [-7.8, 110.36], Semarang: [-6.97, 110.42], Medan: [3.59, 98.67], Makassar: [-5.15, 119.43],
  Denpasar: [-8.65, 115.22], Malang: [-7.98, 112.63], Bekasi: [-6.24, 106.99], Tangerang: [-6.18, 106.63],
  Depok: [-6.4, 106.82], Bogor: [-6.6, 106.8], Palembang: [-2.98, 104.76], Pekanbaru: [0.51, 101.45],
  "Bandar Lampung": [-5.43, 105.26],
};

const AGE_SEGMENTS = ["Remaja", "Dewasa Muda", "Dewasa Tua"] as const;
export function ageSegment(umur: number): typeof AGE_SEGMENTS[number] {
  if (umur < 20) return "Remaja";
  if (umur <= 35) return "Dewasa Muda";
  return "Dewasa Tua";
}

export async function getStrategicKpis() {
  const [totalWisatawan, totalGrup, bookedGrup, completedGrup] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["LEADER", "MEMBER"] } } }),
    prisma.group.count(),
    prisma.group.count({ where: { status: "BOOKED" } }),
    prisma.group.count({ where: { status: { in: ["COMPLETED", "BOOKED"] } } }),
  ]);
  const booked = await prisma.group.findMany({
    where: { status: "BOOKED", finalPackageId: { not: null } },
    select: { totalQuota: true, finalPackage: { select: { hargaPerOrang: true } } },
  });
  const totalRevenue = booked.reduce((s, g) => s + (g.finalPackage ? Number(g.finalPackage.hargaPerOrang) * g.totalQuota : 0), 0);
  const conversionRate = totalGrup ? Math.round((bookedGrup / totalGrup) * 100) : 0;
  return { totalWisatawan, totalGrup, bookedGrup, completedGrup, totalRevenue, conversionRate };
}

// Matriks bobot rata-rata per kriteria, dipecah per segmen (umur / gender).
async function weightMatrix(by: "age" | "gender") {
  const rows = await prisma.userCriteriaWeight.findMany({
    where: { level: "CRITERIA" },
    select: { kriteriaKey: true, computedWeight: true, user: { select: { umur: true, gender: true } } },
  });
  const tree = await getCriteriaTree();
  const critKeys = tree.map((c) => c.key);
  const nameOf: Record<string, string> = Object.fromEntries(tree.map((c) => [c.key, c.nama]));

  const segments = by === "age" ? [...AGE_SEGMENTS] : ["Laki-laki", "Perempuan"];
  // akumulator: seg -> key -> {sum,count}
  const acc: Record<string, Record<string, { sum: number; count: number }>> = {};
  for (const s of segments) { acc[s] = {}; for (const k of critKeys) acc[s][k] = { sum: 0, count: 0 }; }

  for (const r of rows) {
    if (!critKeys.includes(r.kriteriaKey)) continue;
    const seg = by === "age" ? ageSegment(r.user.umur) : r.user.gender;
    if (!acc[seg]) continue;
    acc[seg][r.kriteriaKey].sum += r.computedWeight;
    acc[seg][r.kriteriaKey].count += 1;
  }

  const criteria = critKeys.map((k) => ({ key: k, nama: nameOf[k] ?? k }));
  const data = segments.map((seg) => ({
    segment: seg,
    weights: critKeys.map((k) => {
      const a = acc[seg][k];
      return a.count ? Math.round((a.sum / a.count) * 1000) / 1000 : 0;
    }),
  }));
  return { criteria, segments: data };
}
export const getWeightsByAgeSegment = () => weightMatrix("age");
export const getWeightsByGender = () => weightMatrix("gender");

export async function getTopKota(limit = 8) {
  const grouped = await prisma.user.groupBy({
    by: ["kotaAsal"],
    where: { role: { in: ["LEADER", "MEMBER"] }, kotaAsal: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  return grouped.map((g) => ({ kota: g.kotaAsal as string, count: g._count.id }));
}

// Titik peta: kota dgn koordinat dikenali -> marker; sisanya -> daftar "lainnya".
export async function getOriginMap() {
  const grouped = await prisma.user.groupBy({
    by: ["kotaAsal"],
    where: { role: { in: ["LEADER", "MEMBER"] }, kotaAsal: { not: null } },
    _count: { id: true },
  });
  const points: { kota: string; lat: number; lng: number; count: number }[] = [];
  const unknown: { kota: string; count: number }[] = [];
  for (const g of grouped) {
    const kota = g.kotaAsal as string;
    const c = KOTA_COORD[kota];
    if (c) points.push({ kota, lat: c[0], lng: c[1], count: g._count.id });
    else unknown.push({ kota, count: g._count.id });
  }
  points.sort((a, b) => b.count - a.count);
  return { points, unknown };
}

// Tren 6 bulan terakhir: grup dibuat vs grup dipesan (booked).
export async function getConversionTrend() {
  const since = new Date(); since.setMonth(since.getMonth() - 5); since.setDate(1); since.setHours(0, 0, 0, 0);
  const groups = await prisma.group.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, status: true, bookingDate: true },
  });
  const months: { key: string; label: string; created: number; booked: number }[] = [];
  const idx: Record<string, number> = {};
  const MON = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  for (let i = 0; i < 6; i++) {
    const d = new Date(since); d.setMonth(since.getMonth() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    idx[key] = months.length;
    months.push({ key, label: `${MON[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, created: 0, booked: 0 });
  }
  for (const g of groups) {
    const c = new Date(g.createdAt); const ck = `${c.getFullYear()}-${c.getMonth()}`;
    if (idx[ck] !== undefined) months[idx[ck]].created++;
    if (g.status === "BOOKED" && g.bookingDate) {
      const b = new Date(g.bookingDate); const bk = `${b.getFullYear()}-${b.getMonth()}`;
      if (idx[bk] !== undefined) months[idx[bk]].booked++;
    }
  }
  return months;
}

// Distribusi paket terpilih + revenue per paket (grup BOOKED).
export async function getPackageRevenue() {
  const booked = await prisma.group.findMany({
    where: { status: "BOOKED", finalPackageId: { not: null } },
    select: { totalQuota: true, finalPackage: { select: { namaPaket: true, hargaPerOrang: true } } },
  });
  const acc: Record<string, { count: number; revenue: number }> = {};
  for (const g of booked) {
    const nama = g.finalPackage?.namaPaket ?? "?";
    const rev = g.finalPackage ? Number(g.finalPackage.hargaPerOrang) * g.totalQuota : 0;
    if (!acc[nama]) acc[nama] = { count: 0, revenue: 0 };
    acc[nama].count++; acc[nama].revenue += rev;
  }
  return Object.entries(acc).map(([nama, v]) => ({ nama, ...v })).sort((a, b) => b.revenue - a.revenue);
}

export async function getDemographics() {
  const users = await prisma.user.findMany({ where: { role: { in: ["LEADER", "MEMBER"] } }, select: { umur: true, gender: true } });
  const gender: Record<string, number> = {};
  const ageBuckets = [
    { label: "<20", min: 0, max: 19, count: 0 },
    { label: "20-25", min: 20, max: 25, count: 0 },
    { label: "26-35", min: 26, max: 35, count: 0 },
    { label: "36-45", min: 36, max: 45, count: 0 },
    { label: ">45", min: 46, max: 999, count: 0 },
  ];
  for (const u of users) {
    gender[u.gender] = (gender[u.gender] ?? 0) + 1;
    const b = ageBuckets.find((x) => u.umur >= x.min && u.umur <= x.max);
    if (b) b.count++;
  }
  return { total: users.length, gender: Object.entries(gender).map(([k, v]) => ({ label: k, count: v })), ageBuckets };
}

// Insight naratif berbasis template dari hasil agregasi.
export function generateAIInsight(d: {
  kpi: Awaited<ReturnType<typeof getStrategicKpis>>;
  age: Awaited<ReturnType<typeof getWeightsByAgeSegment>>;
  topKota: Awaited<ReturnType<typeof getTopKota>>;
  pkg: Awaited<ReturnType<typeof getPackageRevenue>>;
}): string[] {
  const out: string[] = [];
  // kriteria paling dominan keseluruhan (rata-rata lintas segmen)
  const sums = d.age.criteria.map((c, i) => ({ nama: c.nama, avg: d.age.segments.reduce((s, seg) => s + (seg.weights[i] ?? 0), 0) / (d.age.segments.length || 1) }));
  sums.sort((a, b) => b.avg - a.avg);
  if (sums[0]?.avg > 0) out.push(`Kriteria paling berpengaruh secara umum adalah "${sums[0].nama}", diikuti "${sums[1]?.nama ?? "-"}".`);
  // segmen umur yg paling mementingkan kriteria teratas
  if (sums[0]) {
    const ci = d.age.criteria.findIndex((c) => c.nama === sums[0].nama);
    let best = { seg: "-", w: -1 };
    for (const s of d.age.segments) if ((s.weights[ci] ?? 0) > best.w) best = { seg: s.segment, w: s.weights[ci] ?? 0 };
    if (best.w > 0) out.push(`Segmen "${best.seg}" paling menekankan "${sums[0].nama}" dibanding segmen lain.`);
  }
  if (d.topKota[0]) out.push(`Mayoritas wisatawan berasal dari ${d.topKota[0].kota} (${d.topKota[0].count} orang).`);
  out.push(`Tingkat konversi booking saat ini ${d.kpi.conversionRate}% (${d.kpi.bookedGrup} dari ${d.kpi.totalGrup} grup).`);
  if (d.pkg[0]) out.push(`Paket paling banyak dipilih: "${d.pkg[0].nama}" (${d.pkg[0].count} grup).`);
  if (out.length === 0) out.push("Belum ada cukup data untuk menghasilkan insight. Insight akan muncul setelah ada grup yang mengisi kuesioner & melakukan booking.");
  return out;
}
