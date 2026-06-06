// lib/bwm-engine.ts
// Best-Worst Method (BWM) — Nested 2-Level.
//
// CATATAN IMPLEMENTASI (penting):
// Versi "linear programming" murni BWM memerlukan LP solver. Untuk menjaga proyek
// bebas-dependency tambahan (lihat aturan 07-CLAUDE #14), engine ini memakai solusi
// closed-form (rata-rata geometrik dari constraint best & worst) yang:
//   - memberi hasil IDENTIK dengan LP saat input konsisten,
//   - memberi aproksimasi baik saat sedikit tidak konsisten,
//   - deterministik & cepat.
// Consistency Ratio (CR) memakai Consistency Index tabel Rezaei (2015).

export interface BwmInput {
  criteria: string[]; // daftar key, mis. ["K2","K3","K8","K1","K5"] atau ["K2_S1",...]
  best: string; // key terbaik
  worst: string; // key terburuk
  bestToOthers: Record<string, number>; // a_Bj (Saaty 1-9), termasuk best->worst
  othersToWorst: Record<string, number>; // a_jW (Saaty 1-9), termasuk best->worst
}

export interface BwmResult {
  weights: Record<string, number>; // ternormalisasi, jumlah = 1
  cr: number; // consistency ratio
  isInconsistent: boolean; // cr > threshold
}

// Consistency Index berdasarkan nilai a_BW (best-to-worst). Rezaei (2015).
const CONSISTENCY_INDEX: Record<number, number> = {
  1: 0.0, 2: 0.44, 3: 1.0, 4: 1.63, 5: 2.3, 6: 3.0, 7: 3.73, 8: 4.47, 9: 5.23,
};

export const CR_THRESHOLD = 0.25; // sesuai PRD/07-CLAUDE

function normalize(weights: Record<string, number>): Record<string, number> {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  for (const k of Object.keys(weights)) out[k] = sum > 0 ? weights[k] / sum : 0;
  return out;
}

/**
 * Hitung bobot BWM untuk SATU responden pada SATU level (kriteria atau subkriteria).
 */
export function computeBwmWeights(input: BwmInput): BwmResult {
  const { criteria, best, worst, bestToOthers, othersToWorst } = input;

  // Estimasi dari sisi BEST: w_j sebanding 1/a_Bj  (best = 1)
  const fromBest: Record<string, number> = {};
  for (const c of criteria) {
    const aBj = bestToOthers[c] ?? (c === best ? 1 : 1);
    fromBest[c] = 1 / aBj;
  }
  // Estimasi dari sisi WORST: w_j sebanding a_jW  (worst = 1)
  const fromWorst: Record<string, number> = {};
  for (const c of criteria) {
    const ajW = othersToWorst[c] ?? (c === worst ? 1 : 1);
    fromWorst[c] = ajW;
  }

  const nB = normalize(fromBest);
  const nW = normalize(fromWorst);

  // Gabung: rata-rata geometrik kedua sisi, lalu normalisasi.
  const combined: Record<string, number> = {};
  for (const c of criteria) combined[c] = Math.sqrt(Math.max(nB[c], 1e-9) * Math.max(nW[c], 1e-9));
  const weights = normalize(combined);

  // Consistency Ratio
  const aBW = bestToOthers[worst] ?? othersToWorst[best] ?? 1;
  const ci = CONSISTENCY_INDEX[Math.round(aBW)] ?? 5.23;
  let xi = 0; // maksimum pelanggaran constraint
  for (const c of criteria) {
    const aBj = bestToOthers[c] ?? 1;
    const ajW = othersToWorst[c] ?? 1;
    xi = Math.max(xi, Math.abs(weights[best] - aBj * weights[c]));
    xi = Math.max(xi, Math.abs(weights[c] - ajW * weights[worst]));
  }
  const cr = ci === 0 ? 0 : xi / ci;

  return { weights, cr: Math.round(cr * 1000) / 1000, isInconsistent: cr > CR_THRESHOLD };
}

/**
 * Agregasi bobot grup = rata-rata geometrik bobot semua anggota (per key), lalu normalisasi.
 * allUserWeights: array of Record<key, weight> (tiap anggota, sudah ternormalisasi).
 */
export function aggregateGroupWeights(allUserWeights: Record<string, number>[]): Record<string, number> {
  if (allUserWeights.length === 0) return {};
  const keys = Object.keys(allUserWeights[0]);
  const agg: Record<string, number> = {};
  for (const k of keys) {
    let prod = 1;
    for (const w of allUserWeights) prod *= Math.max(w[k] ?? 0, 1e-9);
    agg[k] = Math.pow(prod, 1 / allUserWeights.length);
  }
  return normalize(agg);
}
