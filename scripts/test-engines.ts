// scripts/test-engines.ts — uji parser + semua engine (jalankan: npm run test:engine)
import { parseDestinations, parseScores, parseHotels, parseKuliner } from "../prisma/seed-helpers";
import { computeBwmWeights, aggregateGroupWeights } from "../lib/bwm-engine";
import { computeTopsisRanking, TopsisDestinationScores } from "../lib/topsis-engine";
import { haversine, nearestNeighbor } from "../lib/route-optimizer";

import path from "path";
const DATA = path.join(process.cwd(), "data");
let pass = 0, fail = 0;
function check(label: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${label} ${extra}`); }
  else { fail++; console.log(`  ✗ FAIL: ${label} ${extra}`); }
}

console.log("=== 1. PARSER ===");
const dest = parseDestinations(DATA);
const scores = parseScores(DATA);
const hotels = parseHotels(DATA);
const kuliner = parseKuliner(DATA);

check("75 destinasi", dest.length === 75, `(got ${dest.length})`);
check("3000 skor", scores.length === 3000, `(got ${scores.length})`);
check("32 hotel", hotels.length === 32, `(got ${hotels.length})`);
check("20 kuliner", kuliner.length === 20, `(got ${kuliner.length})`);

// integritas: setiap destinasi tepat 40 skor
const perDest = new Map<string, number>();
for (const s of scores) perDest.set(s.destCode, (perDest.get(s.destCode) ?? 0) + 1);
check("tiap destinasi punya 40 skor", [...perDest.values()].every((n) => n === 40), `(unik=${perDest.size})`);
check("semua skor 1-5", scores.every((s) => s.scoreValue >= 1 && s.scoreValue <= 5));
check("hotel tier valid", hotels.every((h) => ["BUDGET", "STANDARD", "PREMIUM"].includes(h.tier)));
const tierCount = hotels.reduce((a, h) => ((a[h.tier] = (a[h.tier] ?? 0) + 1), a), {} as Record<string, number>);
console.log("    tier:", JSON.stringify(tierCount));

// sample destinasi pertama
const d0 = dest[0];
console.log("    contoh DST-01:", d0.nama, "| fasilitas:", d0.fasilitas.slice(0, 40), "...");
console.log("    waktu:", d0.waktuKunjunganIdeal, "| aksesBus:", d0.aksesBus, "| tips:", JSON.parse(d0.tipsRombongan).length, "item");
check("fasilitas valid JSON array", Array.isArray(JSON.parse(d0.fasilitas)));
check("tipsRombongan valid JSON array", Array.isArray(JSON.parse(d0.tipsRombongan)));
check("alamatLengkap & deskripsiPanjang terisi", !!d0.alamatLengkap && !!d0.deskripsiPanjang);
check("koordinat masuk akal (Jogja)", dest.every((d) => d.latitude < -7 && d.latitude > -9 && d.longitude > 110 && d.longitude < 111));

console.log("\n=== 2. BWM ENGINE ===");
// Mock 1 responden: kriteria aktif K2,K3,K8,K1,K5. Best=K2, Worst=K1.
const criteria = ["K2", "K3", "K8", "K1", "K5"];
const u1 = computeBwmWeights({
  criteria, best: "K2", worst: "K1",
  bestToOthers: { K2: 1, K3: 2, K8: 3, K1: 8, K5: 4 },
  othersToWorst: { K1: 1, K5: 2, K8: 3, K3: 4, K2: 8 },
});
console.log("    bobot u1:", Object.fromEntries(Object.entries(u1.weights).map(([k, v]) => [k, +v.toFixed(3)])));
const sum1 = Object.values(u1.weights).reduce((a, b) => a + b, 0);
check("bobot u1 jumlah = 1", Math.abs(sum1 - 1) < 1e-6, `(${sum1.toFixed(4)})`);
check("K2 (best) bobot tertinggi", u1.weights.K2 === Math.max(...Object.values(u1.weights)));
check("K1 (worst) bobot terendah", u1.weights.K1 === Math.min(...Object.values(u1.weights)));
check("CR terdefinisi & wajar", u1.cr >= 0 && u1.cr < 1, `(CR=${u1.cr})`);

// Konsistensi sempurna -> CR mendekati 0
const consistent = computeBwmWeights({
  criteria: ["A", "B", "C"], best: "A", worst: "C",
  bestToOthers: { A: 1, B: 2, C: 4 },
  othersToWorst: { C: 1, B: 2, A: 4 },
});
check("input konsisten -> CR ~ 0", consistent.cr < 0.05, `(CR=${consistent.cr})`);

// Agregasi 3 anggota
const u2 = computeBwmWeights({ criteria, best: "K8", worst: "K1",
  bestToOthers: { K8: 1, K2: 2, K3: 2, K5: 3, K1: 6 },
  othersToWorst: { K1: 1, K5: 2, K3: 3, K2: 4, K8: 6 } });
const u3 = computeBwmWeights({ criteria, best: "K3", worst: "K5",
  bestToOthers: { K3: 1, K2: 2, K8: 3, K1: 4, K5: 5 },
  othersToWorst: { K5: 1, K1: 2, K8: 2, K2: 3, K3: 5 } });
const group = aggregateGroupWeights([u1.weights, u2.weights, u3.weights]);
const sumG = Object.values(group).reduce((a, b) => a + b, 0);
console.log("    bobot grup:", Object.fromEntries(Object.entries(group).map(([k, v]) => [k, +v.toFixed(3)])));
check("bobot grup jumlah = 1", Math.abs(sumG - 1) < 1e-6, `(${sumG.toFixed(4)})`);

console.log("\n=== 3. TOPSIS ENGINE (data asli) ===");
// Subkriteria aktif = 5 sub dari tiap kriteria aktif (K2,K3,K8,K1,K5) = 25 sub.
// Bobot final = W_kriteria/5 dibagi rata ke 5 subkriteria (mock sederhana untuk test).
const activeCriteria = ["K2", "K3", "K8", "K1", "K5"];
const subWeights: Record<string, number> = {};
for (const kc of activeCriteria) for (let s = 1; s <= 5; s++) subWeights[`${kc}_S${s}`] = group[kc] / 5;
// normalisasi (harusnya sudah ~1)
const sw = Object.values(subWeights).reduce((a, b) => a + b, 0);
for (const k of Object.keys(subWeights)) subWeights[k] /= sw;

// bangun data skor per destinasi untuk subkriteria aktif
const codeToId = new Map<string, number>();
dest.forEach((d, i) => codeToId.set(d.code, i + 1)); // simulasikan id DB 1..75
const byDest = new Map<number, Record<string, number>>();
for (const s of scores) {
  if (subWeights[s.subCriteriaKey] === undefined) continue;
  const id = codeToId.get(s.destCode)!;
  if (!byDest.has(id)) byDest.set(id, {});
  byDest.get(id)![s.subCriteriaKey] = s.scoreValue;
}
const topsisData: TopsisDestinationScores[] = [...byDest.entries()].map(([destinationId, sc]) => ({ destinationId, scores: sc }));
const ranking = computeTopsisRanking(subWeights, topsisData);

check("ranking 75 destinasi", ranking.length === 75, `(got ${ranking.length})`);
check("ranking 1..75 unik & lengkap", new Set(ranking.map((r) => r.ranking)).size === 75 && ranking[0].ranking === 1);
check("semua CI dalam [0,1]", ranking.every((r) => r.ciScore >= 0 && r.ciScore <= 1));
check("CI menurun sesuai ranking", ranking.every((r, i) => i === 0 || ranking[i - 1].ciScore >= r.ciScore));
const idToName = new Map<number, string>();
dest.forEach((d, i) => idToName.set(i + 1, d.nama));
console.log("    TOP 5 (bobot mock K2/K3/K8 dominan):");
ranking.slice(0, 5).forEach((r) => console.log(`      #${r.ranking} ${idToName.get(r.destinationId)} (CI=${r.ciScore})`));

console.log("\n=== 4. ROUTE OPTIMIZER ===");
// Malioboro (-7.7925,110.3656) -> Prambanan (-7.7520,110.4914) ~ 14-15 km
const dMP = haversine(-7.7925, 110.3656, -7.7520, 110.4914);
console.log("    Malioboro->Prambanan:", dMP.toFixed(2), "km");
check("Haversine Malioboro-Prambanan ~14-16km", dMP > 13 && dMP < 17, `(${dMP.toFixed(2)})`);
// nearest neighbor dari Malioboro ke 3 destinasi
const start = { latitude: -7.7925, longitude: 110.3656 };
const pts = [
  { latitude: -7.752, longitude: 110.4914, nama: "Prambanan" },
  { latitude: -7.8108, longitude: 110.3592, nama: "Taman Sari" },
  { latitude: -7.7708, longitude: 110.5083, nama: "Tebing Breksi" },
];
const route = nearestNeighbor(start, pts);
console.log("    rute NN:", route.map((r) => `${r.dest.nama}(${r.distance}km)`).join(" -> "));
check("NN mengunjungi semua titik", route.length === 3);
check("NN pertama = terdekat (Taman Sari)", route[0].dest.nama === "Taman Sari");

console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
if (fail > 0) process.exit(1);
