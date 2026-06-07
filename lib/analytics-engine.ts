// lib/analytics-engine.ts
// Helper agregasi untuk dashboard admin (Live Tracker & Operational Insights).
import { prisma } from "@/lib/prisma";

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/** 4 metric cards Live Tracker. */
export async function getLiveGroupStats() {
  const today = startOfToday();
  const [inProgressToday, completedToday, bookedToday, totalUsers, totalGroups] = await Promise.all([
    prisma.group.count({ where: { status: "IN_PROGRESS", createdAt: { gte: today } } }),
    prisma.group.count({ where: { status: "COMPLETED", updatedAt: { gte: today } } }),
    prisma.group.count({ where: { status: "BOOKED", bookingDate: { gte: today } } }),
    prisma.user.count({ where: { role: { in: ["LEADER", "MEMBER"] } } }),
    prisma.group.count(),
  ]);
  return { inProgressToday, completedToday, bookedToday, totalUsers, totalGroups };
}

/** Daftar grup untuk live grid (status + progres + anggota). */
export async function getLiveGroups(limit = 24) {
  const groups = await prisma.group.findMany({
    orderBy: { updatedAt: "desc" }, take: limit,
    include: {
      leader: { select: { nama: true } },
      members: { where: { removedAt: null }, include: { user: { select: { id: true, nama: true } } } },
      finalPackage: { select: { namaPaket: true, hargaPerOrang: true } },
    },
  });
  return groups.map((g) => ({
    id: g.id, code: g.groupCode, name: g.groupName, status: g.status,
    leader: g.leader.nama, quota: g.totalQuota,
    joined: g.members.length,
    submitted: g.members.filter((m) => m.hasSubmitted).length,
    members: g.members.map((m) => ({ nama: m.user.nama, hasSubmitted: m.hasSubmitted, isLeader: m.user.id === g.leaderId })),
    finalPaket: g.finalPackage?.namaPaket ?? null,
    revenue: g.finalPackage ? Number(g.finalPackage.hargaPerOrang) * g.totalQuota : 0,
  }));
}

/** Top destinasi paling sering masuk peringkat 1-10 (lintas grup). */
export async function getMostPopularDestinations(limit = 10) {
  const grouped = await prisma.groupTopsisResult.groupBy({
    by: ["destinationId"], where: { ranking: { lte: 10 } },
    _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: limit,
  });
  const ids = grouped.map((g) => g.destinationId);
  const dests = await prisma.destination.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true, kategori: true } });
  const map = new Map(dests.map((d) => [d.id, d]));
  return grouped.map((g) => ({ id: g.destinationId, nama: map.get(g.destinationId)?.nama ?? "?", kategori: map.get(g.destinationId)?.kategori ?? "?", count: g._count.id }));
}

/** Distribusi kategori dari Top-3 destinasi semua grup (donut). */
export async function getKategoriDistribution() {
  const top3 = await prisma.groupTopsisResult.findMany({ where: { ranking: { lte: 3 } }, include: { destination: { select: { kategori: true } } } });
  const dist: Record<string, number> = {};
  for (const r of top3) dist[r.destination.kategori] = (dist[r.destination.kategori] ?? 0) + 1;
  return Object.entries(dist).map(([kategori, count]) => ({ kategori, count })).sort((a, b) => b.count - a.count);
}

/** Destinasi performa rendah (sering di peringkat >= 50). */
export async function getLowPerformers(limit = 8) {
  const grouped = await prisma.groupTopsisResult.groupBy({
    by: ["destinationId"], where: { ranking: { gte: 50 } },
    _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: limit,
  });
  const ids = grouped.map((g) => g.destinationId);
  const dests = await prisma.destination.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true, kategori: true, wilayah: true } });
  const map = new Map(dests.map((d) => [d.id, d]));
  return grouped.map((g) => {
    const d = map.get(g.destinationId);
    return { id: g.destinationId, nama: d?.nama ?? "?", kategori: d?.kategori ?? "?", wilayah: d?.wilayah ?? "?", count: g._count.id };
  });
}

/** Distribusi durasi tour (1H / 2D1N / 3D2N). */
export async function getDurasiDistribution() {
  const grouped = await prisma.group.groupBy({ by: ["durasiTour"], _count: { id: true } });
  const total = grouped.reduce((s, g) => s + g._count.id, 0) || 1;
  const label: Record<number, string> = { 1: "1 Hari", 2: "2D1N", 3: "3D2N" };
  return grouped
    .map((g) => ({ durasi: g.durasiTour, label: label[g.durasiTour] ?? `${g.durasiTour} hari`, count: g._count.id, pct: Math.round((g._count.id / total) * 100) }))
    .sort((a, b) => a.durasi - b.durasi);
}
