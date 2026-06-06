// lib/topsis-engine.ts
// TOPSIS — Technique for Order Preference by Similarity to Ideal Solution.
// Semua subkriteria diperlakukan sebagai BENEFIT (skor 1-5 = makin tinggi makin baik,
// karena skor sudah berupa nilai "desirability" dari tim pakar, bukan nilai mentah).

export interface TopsisDestinationScores {
  destinationId: number;
  scores: Record<string, number>; // { "K2_S1": 4, "K3_S1": 5, ... } hanya subkriteria aktif
}

export interface TopsisResult {
  destinationId: number;
  ciScore: number; // closeness coefficient C_i* (0-1)
  ranking: number; // 1 = terbaik
}

/**
 * @param weights  bobot final per-subkriteria aktif, mis. { "K2_S1": 0.05, ... } (jumlah = 1)
 * @param data     skor tiap destinasi untuk subkriteria aktif
 */
export function computeTopsisRanking(
  weights: Record<string, number>,
  data: TopsisDestinationScores[]
): TopsisResult[] {
  const subKeys = Object.keys(weights);
  if (subKeys.length === 0 || data.length === 0) return [];

  // 1) Denominator normalisasi vektor per kolom: sqrt(sum(x^2))
  const denom: Record<string, number> = {};
  for (const k of subKeys) {
    let s = 0;
    for (const d of data) s += (d.scores[k] ?? 0) ** 2;
    denom[k] = Math.sqrt(s) || 1;
  }

  // 2) Matriks ternormalisasi terbobot: v_ij = w_j * (x_ij / denom_j)
  const weighted = data.map((d) => {
    const v: Record<string, number> = {};
    for (const k of subKeys) v[k] = weights[k] * ((d.scores[k] ?? 0) / denom[k]);
    return { destinationId: d.destinationId, v };
  });

  // 3) Solusi ideal positif (A+) & negatif (A-) — semua benefit
  const aPlus: Record<string, number> = {};
  const aMinus: Record<string, number> = {};
  for (const k of subKeys) {
    let mx = -Infinity, mn = Infinity;
    for (const w of weighted) {
      mx = Math.max(mx, w.v[k]);
      mn = Math.min(mn, w.v[k]);
    }
    aPlus[k] = mx;
    aMinus[k] = mn;
  }

  // 4) Jarak ke A+ dan A-, lalu closeness C_i*
  const scored = weighted.map((w) => {
    let sPlus = 0, sMinus = 0;
    for (const k of subKeys) {
      sPlus += (w.v[k] - aPlus[k]) ** 2;
      sMinus += (w.v[k] - aMinus[k]) ** 2;
    }
    sPlus = Math.sqrt(sPlus);
    sMinus = Math.sqrt(sMinus);
    const ci = sPlus + sMinus === 0 ? 0 : sMinus / (sPlus + sMinus);
    return { destinationId: w.destinationId, ciScore: Math.round(ci * 100000) / 100000 };
  });

  // 5) Ranking (CI tertinggi = ranking 1)
  scored.sort((a, b) => b.ciScore - a.ciScore);
  return scored.map((s, i) => ({ ...s, ranking: i + 1 }));
}
