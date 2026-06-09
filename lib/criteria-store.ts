// lib/criteria-store.ts
// Kriteria & subkriteria DB-driven (tabel Criteria + SubCriteria). Auto-seed dari CRITERIA_MASTER saat kosong.
import { prisma } from "@/lib/prisma";
import { CRITERIA_MASTER } from "@/lib/criteria-master";

export const MIN_OPSIONAL = 2;

export interface SubC { key: string; nama: string }
export interface CritC { key: string; nama: string; wajib: boolean; deskripsi: string | null; subKriteria: SubC[] }

// Race-safe: pakai createMany + skipDuplicates supaya aman walau dua request menyeed bersamaan.
export async function ensureCriteriaSeeded(): Promise<void> {
  const n = await prisma.criteria.count();
  if (n > 0) return;
  await prisma.criteria.createMany({
    data: CRITERIA_MASTER.map((c, i) => ({ key: c.key, nama: c.nama, wajib: c.wajib, urutan: i })),
    skipDuplicates: true,
  });
  await prisma.subCriteria.createMany({
    data: CRITERIA_MASTER.flatMap((c) => c.subKriteria.map((s, j) => ({ key: s.key, criteriaKey: c.key, nama: s.nama, urutan: j }))),
    skipDuplicates: true,
  });
}

export async function getCriteriaTree(): Promise<CritC[]> {
  await ensureCriteriaSeeded();
  const rows = await prisma.criteria.findMany({ orderBy: { urutan: "asc" }, include: { subKriteria: { orderBy: { urutan: "asc" } } } });
  return rows.map((c) => ({ key: c.key, nama: c.nama, wajib: c.wajib, deskripsi: c.deskripsi, subKriteria: c.subKriteria.map((s) => ({ key: s.key, nama: s.nama })) }));
}

export async function getWajibKeys(): Promise<string[]> {
  const t = await getCriteriaTree();
  return t.filter((c) => c.wajib).map((c) => c.key);
}

export function nextCriteriaKey(existing: string[]): string {
  const used = new Set(existing);
  let n = 1;
  while (used.has("K" + n)) n++;
  return "K" + n;
}
export function nextSubKey(critKey: string, existingSub: string[]): string {
  const used = new Set(existingSub);
  let n = 1;
  while (used.has(`${critKey}_S${n}`)) n++;
  return `${critKey}_S${n}`;
}
