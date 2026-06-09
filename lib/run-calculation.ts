// lib/run-calculation.ts
// Kalkulasi grup: agregasi bobot anggota (geometric mean) -> bobot subkriteria final (nested)
// -> TOPSIS atas semua destinasi -> simpan GroupCriteriaWeight + GroupTopsisResult -> generate 3 paket.
import { prisma } from "@/lib/prisma";
import { aggregateGroupWeights } from "@/lib/bwm-engine";
import { computeTopsisRanking, TopsisDestinationScores } from "@/lib/topsis-engine";
import { getCriteriaTree } from "@/lib/criteria-store";
import { generateThreePackages } from "@/lib/generate-packages";

export interface CalcSummary { members: number; destinations: number; subKeys: number; packages: number }

const DEFAULT_SCORE = 3; // subkriteria baru tanpa skor dianggap netral (3 dari 5)

export async function runGroupCalculation(groupId: number): Promise<CalcSummary> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Grup tidak ditemukan");

  let activeKeys: string[] = [];
  try { activeKeys = JSON.parse(group.activeCriteria); } catch { activeKeys = []; }

  const tree = await getCriteriaTree();
  const subKeysOf = (ck: string) => (tree.find((c) => c.key === ck)?.subKriteria ?? []).map((s) => s.key);

  // 1) Ambil semua bobot user (level CRITERIA + SUBCRITERIA)
  const userWeights = await prisma.userCriteriaWeight.findMany({ where: { groupId } });
  const byUser = new Map<number, typeof userWeights>();
  for (const w of userWeights) {
    if (!byUser.has(w.userId)) byUser.set(w.userId, []);
    byUser.get(w.userId)!.push(w);
  }
  const userIds = [...byUser.keys()];
  if (userIds.length === 0) throw new Error("Belum ada jawaban untuk diagregasi");

  // 2a) Agregasi CRITERIA
  const critVectors = userIds.map((uid) => {
    const rec: Record<string, number> = {};
    for (const k of activeKeys) rec[k] = 0;
    for (const w of byUser.get(uid)!) if (w.level === "CRITERIA") rec[w.kriteriaKey] = w.computedWeight;
    return rec;
  });
  const groupCritW = aggregateGroupWeights(critVectors);

  // 2b) Agregasi SUBCRITERIA per kriteria
  const groupSubW: Record<string, Record<string, number>> = {};
  for (const ck of activeKeys) {
    const subKeys = subKeysOf(ck);
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

  // 4) TOPSIS: skor SEMUA destinasi untuk subkriteria aktif (default 3 bila belum diisi)
  const activeSubKeys = Object.keys(finalWeights);
  const [dests, scores] = await Promise.all([
    prisma.destination.findMany({ select: { id: true } }),
    prisma.destinationScore.findMany({ where: { subCriteriaKey: { in: activeSubKeys } }, select: { destinationId: true, subCriteriaKey: true, scoreValue: true } }),
  ]);
  const scoreMap = new Map<number, Record<string, number>>();
  for (const s of scores) {
    if (!scoreMap.has(s.destinationId)) scoreMap.set(s.destinationId, {});
    scoreMap.get(s.destinationId)![s.subCriteriaKey] = s.scoreValue;
  }
  const data: TopsisDestinationScores[] = dests.map((d) => {
    const sc: Record<string, number> = {};
    const existing = scoreMap.get(d.id) ?? {};
    for (const sk of activeSubKeys) sc[sk] = existing[sk] ?? DEFAULT_SCORE;
    return { destinationId: d.id, scores: sc };
  });
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
    prisma.groupTopsisResult.createMany({ data: ranking.map((r) => ({ groupId, destinationId: r.destinationId, ciScore: r.ciScore, ranking: r.ranking })) }),
  ]);

  // 6) Generate 3 paket wisata (Paket A/B/C) dari hasil TOPSIS
  const pkg = await generateThreePackages(groupId);

  // 7) Tandai grup selesai
  await prisma.group.update({ where: { id: groupId }, data: { status: "COMPLETED" } });

  return { members: userIds.length, destinations: ranking.length, subKeys: activeSubKeys.length, packages: pkg.packages };
}
