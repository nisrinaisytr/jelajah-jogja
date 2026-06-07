// lib/run-calculation.ts
// Kalkulasi grup: agregasi bobot anggota (geometric mean) -> bobot subkriteria final (nested)
// -> TOPSIS atas 75 destinasi -> simpan GroupCriteriaWeight + GroupTopsisResult.
// CATATAN: generasi 3 paket wisata (TourPackage) menyusul di Tahap 8.
import { prisma } from "@/lib/prisma";
import { aggregateGroupWeights } from "@/lib/bwm-engine";
import { computeTopsisRanking, TopsisDestinationScores } from "@/lib/topsis-engine";
import { CRITERIA_MASTER } from "@/lib/criteria-master";
import { generateThreePackages } from "@/lib/generate-packages";

export interface CalcSummary { members: number; destinations: number; subKeys: number; packages: number }

export async function runGroupCalculation(groupId: number): Promise<CalcSummary> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Grup tidak ditemukan");

  let activeKeys: string[] = [];
  try { activeKeys = JSON.parse(group.activeCriteria); } catch { activeKeys = []; }

  // 1) Ambil semua bobot user (level CRITERIA + SUBCRITERIA)
  const userWeights = await prisma.userCriteriaWeight.findMany({ where: { groupId } });
  const byUser = new Map<number, typeof userWeights>();
  for (const w of userWeights) {
    if (!byUser.has(w.userId)) byUser.set(w.userId, []);
    byUser.get(w.userId)!.push(w);
  }
  const userIds = [...byUser.keys()];
  if (userIds.length === 0) throw new Error("Belum ada jawaban untuk diagregasi");

  // 2a) Agregasi CRITERIA (geometric mean antar anggota)
  const critVectors = userIds.map((uid) => {
    const rec: Record<string, number> = {};
    for (const k of activeKeys) rec[k] = 0;
    for (const w of byUser.get(uid)!) if (w.level === "CRITERIA") rec[w.kriteriaKey] = w.computedWeight;
    return rec;
  });
  const groupCritW = aggregateGroupWeights(critVectors); // { Kx: W_j }, sum=1

  // 2b) Agregasi SUBCRITERIA per kriteria
  const groupSubW: Record<string, Record<string, number>> = {};
  for (const ck of activeKeys) {
    const subKeys = (CRITERIA_MASTER.find((c) => c.key === ck)?.subKriteria ?? []).map((s) => s.key);
    const vectors = userIds.map((uid) => {
      const rec: Record<string, number> = {};
      for (const sk of subKeys) rec[sk] = 0;
      for (const w of byUser.get(uid)!) if (w.level === "SUBCRITERIA" && w.parentKriteria === ck) rec[w.kriteriaKey] = w.computedWeight;
      return rec;
    });
    groupSubW[ck] = aggregateGroupWeights(vectors);
  }

  // 3) Bobot subkriteria final (nested): w_final = W_j * w_sub
  const finalWeights: Record<string, number> = {};
  for (const ck of activeKeys) {
    const Wj = groupCritW[ck] ?? 0;
    for (const [sk, wsub] of Object.entries(groupSubW[ck] ?? {})) finalWeights[sk] = Wj * wsub;
  }
  const sumF = Object.values(finalWeights).reduce((a, b) => a + b, 0) || 1;
  for (const k of Object.keys(finalWeights)) finalWeights[k] /= sumF;

  // 4) TOPSIS: skor destinasi utk subkriteria aktif
  const activeSubKeys = Object.keys(finalWeights);
  const scores = await prisma.destinationScore.findMany({
    where: { subCriteriaKey: { in: activeSubKeys } },
    select: { destinationId: true, subCriteriaKey: true, scoreValue: true },
  });
  const dataMap = new Map<number, Record<string, number>>();
  for (const s of scores) {
    if (!dataMap.has(s.destinationId)) dataMap.set(s.destinationId, {});
    dataMap.get(s.destinationId)![s.subCriteriaKey] = s.scoreValue;
  }
  const data: TopsisDestinationScores[] = [...dataMap.entries()].map(([destinationId, sc]) => ({ destinationId, scores: sc }));
  const ranking = computeTopsisRanking(finalWeights, data);

  // 5) Simpan (idempoten)
  await prisma.$transaction([
    prisma.groupCriteriaWeight.deleteMany({ where: { groupId } }),
    prisma.groupTopsisResult.deleteMany({ where: { groupId } }),
    prisma.groupCriteriaWeight.createMany({
      data: [
        ...activeKeys.map((ck) => ({ groupId, level: "CRITERIA" as const, parentKriteria: null, kriteriaKey: ck, weight: groupCritW[ck] ?? 0 })),
        ...activeKeys.flatMap((ck) =>
          Object.entries(groupSubW[ck] ?? {}).map(([sk, w]) => ({ groupId, level: "SUBCRITERIA" as const, parentKriteria: ck, kriteriaKey: sk, weight: w }))
        ),
      ],
    }),
    prisma.groupTopsisResult.createMany({
      data: ranking.map((r) => ({ groupId, destinationId: r.destinationId, ciScore: r.ciScore, ranking: r.ranking })),
    }),
  ]);

  // 6) Generate 3 paket wisata (Hemat/Standard/Premium) dari hasil TOPSIS
  const pkg = await generateThreePackages(groupId);

  // 7) Tandai grup selesai (siap dilihat di halaman hasil)
  await prisma.group.update({ where: { id: groupId }, data: { status: "COMPLETED" } });

  return { members: userIds.length, destinations: ranking.length, subKeys: activeSubKeys.length, packages: pkg.packages };
}
