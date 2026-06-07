// app/api/survey/submit/route.ts
// Terima jawaban BWM (raw), hitung bobot per level di server, simpan UserBwmAnswer + UserCriteriaWeight,
// tandai GroupMember.hasSubmitted = true.
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeBwmWeights } from "@/lib/bwm-engine";
import { CRITERIA_MASTER } from "@/lib/criteria-master";
import { runGroupCalculation } from "@/lib/run-calculation";

const picks = z.object({
  best: z.string().min(1),
  worst: z.string().min(1),
  b2o: z.record(z.number()),
  o2w: z.record(z.number()),
});
const schema = z.object({
  groupCode: z.string().min(1),
  criteria: picks,
  subs: z.record(picks),
});

type Picks = z.infer<typeof picks>;
interface AnswerRow {
  userId: number; groupId: number; level: "CRITERIA" | "SUBCRITERIA"; parentKriteria: string | null;
  bestCriteria: string; worstCriteria: string; comparisonType: string; targetCriteria: string;
  scoreValue: number; isInconsistent: boolean; consistencyRatio: number;
}
interface WeightRow {
  userId: number; groupId: number; level: "CRITERIA" | "SUBCRITERIA"; parentKriteria: string | null;
  kriteriaKey: string; computedWeight: number;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    const userId = session.user.id;

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Data jawaban tidak valid" }, { status: 400 });
    const { groupCode, criteria, subs } = parsed.data;

    const group = await prisma.group.findUnique({ where: { groupCode: groupCode.toUpperCase() } });
    if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (!member || member.removedAt) return NextResponse.json({ error: "Anda bukan anggota grup ini" }, { status: 403 });

    let activeKeys: string[] = [];
    try { activeKeys = JSON.parse(group.activeCriteria); } catch { activeKeys = []; }

    // Validasi: best/worst kriteria harus termasuk activeCriteria
    if (!activeKeys.includes(criteria.best) || !activeKeys.includes(criteria.worst)) {
      return NextResponse.json({ error: "Pilihan kriteria tidak valid" }, { status: 400 });
    }

    const answers: AnswerRow[] = [];
    const weights: WeightRow[] = [];

    // Bangun baris jawaban + hitung bobot untuk SATU level
    function processLevel(keys: string[], p: Picks, level: "CRITERIA" | "SUBCRITERIA", parent: string | null) {
      const result = computeBwmWeights({
        criteria: keys,
        best: p.best,
        worst: p.worst,
        bestToOthers: p.b2o,
        othersToWorst: p.o2w,
      });
      const cr = result.cr;
      const inc = result.isInconsistent;
      // jawaban BEST_TO_OTHERS
      for (const [target, v] of Object.entries(p.b2o)) {
        if (target === p.best) continue;
        answers.push({ userId, groupId: group!.id, level, parentKriteria: parent, bestCriteria: p.best, worstCriteria: p.worst, comparisonType: "BEST_TO_OTHERS", targetCriteria: target, scoreValue: Math.round(v), isInconsistent: inc, consistencyRatio: cr });
      }
      // jawaban OTHERS_TO_WORST
      for (const [target, v] of Object.entries(p.o2w)) {
        if (target === p.worst) continue;
        answers.push({ userId, groupId: group!.id, level, parentKriteria: parent, bestCriteria: p.best, worstCriteria: p.worst, comparisonType: "OTHERS_TO_WORST", targetCriteria: target, scoreValue: Math.round(v), isInconsistent: inc, consistencyRatio: cr });
      }
      // bobot
      for (const [k, w] of Object.entries(result.weights)) {
        weights.push({ userId, groupId: group!.id, level, parentKriteria: parent, kriteriaKey: k, computedWeight: w });
      }
    }

    // Level 1: kriteria
    processLevel(activeKeys, criteria, "CRITERIA", null);

    // Level 2: subkriteria tiap kriteria aktif
    for (const ck of activeKeys) {
      const sub = subs[ck];
      const master = CRITERIA_MASTER.find((c) => c.key === ck);
      if (!sub || !master) return NextResponse.json({ error: `Jawaban subkriteria ${ck} kurang` }, { status: 400 });
      const subKeys = master.subKriteria.map((s) => s.key);
      if (!subKeys.includes(sub.best) || !subKeys.includes(sub.worst)) {
        return NextResponse.json({ error: `Pilihan subkriteria ${ck} tidak valid` }, { status: 400 });
      }
      processLevel(subKeys, sub, "SUBCRITERIA", ck);
    }

    // Simpan (idempoten: hapus lama lalu insert baru)
    await prisma.$transaction([
      prisma.userBwmAnswer.deleteMany({ where: { userId, groupId: group.id } }),
      prisma.userCriteriaWeight.deleteMany({ where: { userId, groupId: group.id } }),
      prisma.userBwmAnswer.createMany({ data: answers }),
      prisma.userCriteriaWeight.createMany({ data: weights }),
      prisma.groupMember.update({
        where: { groupId_userId: { groupId: group.id, userId } },
        data: { hasSubmitted: true, submittedAt: new Date() },
      }),
    ]);

    // Cek apakah semua anggota aktif sudah submit (kalkulasi penuh menyusul di Tahap 7-8)
    const [activeCount, submittedCount] = await Promise.all([
      prisma.groupMember.count({ where: { groupId: group.id, removedAt: null } }),
      prisma.groupMember.count({ where: { groupId: group.id, removedAt: null, hasSubmitted: true } }),
    ]);
    const allSubmitted = activeCount >= 2 && activeCount === submittedCount; // min 2 anggota (kolaboratif)

    // Anggota terakhir submit -> jalankan kalkulasi penuh (agregasi + TOPSIS + 3 paket)
    let calculated = false;
    if (allSubmitted) {
      try { await runGroupCalculation(group.id); calculated = true; }
      catch (e) { console.error("auto-calc gagal:", e); }
    }

    return NextResponse.json({ ok: true, allSubmitted, calculated, answers: answers.length, weights: weights.length });
  } catch (e) {
    console.error("survey/submit error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
