// prisma/seed-helpers.ts
// Parser tabel Markdown untuk seeding. Pure function (tanpa Prisma) supaya mudah dites.
// Membaca 3 file di folder data/: master-database-lengkap.md, master-data-hotel.md, master-data-kuliner.md
import fs from "fs";
import path from "path";

// ---------- Tipe data hasil parse (sesuai schema Prisma) ----------
export interface ParsedDestination {
  code: string; // "DST-01" (hanya untuk mapping ke skor, BUKAN id DB)
  nama: string;
  kategori: string;
  wilayah: string;
  latitude: number;
  longitude: number;
  waktuKunjunganIdeal: string; // PAGI/SIANG/SORE/MALAM/FLEKSIBEL
  durasiKunjungan: number;
  hargaTiket: number;
  rating: number;
  imageUrl: string;
  aksesBus: boolean;
  bolehDrone: boolean;
  jarakPusat: number;
  kulinerLokal: string;
  deskripsi: string;
  fasilitas: string; // JSON string array
  alamatLengkap: string;
  jamBuka: string;
  jamTutup: string;
  tipsRombongan: string; // JSON string array
  deskripsiPanjang: string;
}

export interface ParsedScore {
  destCode: string; // "DST-01"
  kriteriaKey: string; // "K2"
  subCriteriaKey: string; // "K2_S1"
  scoreValue: number; // 1-5
}

export interface ParsedHotel {
  nama: string;
  alamat: string;
  wilayah: string;
  latitude: number;
  longitude: number;
  rating: number;
  hargaPerMalam: number;
  fasilitas: string; // JSON string array
  imageUrl: string;
  tier: string; // BUDGET/STANDARD/PREMIUM
}

export interface ParsedKuliner {
  nama: string;
  jenis: string;
  alamat: string;
  latitude: number;
  longitude: number;
  hargaRataRata: number;
  rating: number;
}

// ---------- Generic markdown table parser ----------
interface MdTable {
  headers: string[];
  rows: string[][];
}

function splitRow(line: string): string[] {
  // baris markdown: "| a | b | c |" -> ["a","b","c"]
  const parts = line.split("|");
  // buang elemen kosong pertama & terakhir akibat pipe di tepi
  return parts.slice(1, parts.length - 1).map((c) => c.trim());
}

function isSeparator(line: string): boolean {
  // baris pemisah header: "| --- | --- |"
  return /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes("-");
}

/** Ambil SEMUA tabel markdown dari sebuah teks. */
function parseAllTables(md: string): MdTable[] {
  const lines = md.split(/\r?\n/);
  const tables: MdTable[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const isTableLine = line.trim().startsWith("|");
    const next = lines[i + 1] ?? "";
    if (isTableLine && isSeparator(next)) {
      const headers = splitRow(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|") && !isSeparator(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      tables.push({ headers, rows });
      i = j;
    } else {
      i++;
    }
  }
  return tables;
}

function findTable(tables: MdTable[], headerIncludes: string): MdTable | undefined {
  return tables.find((t) => t.headers.some((h) => h === headerIncludes));
}

const toNum = (s: string) => Number(String(s).replace(/[^\d.\-]/g, ""));
const toBool = (s: string) => String(s).trim().toUpperCase() === "TRUE";

// ---------- Parser: Destinasi (gabung Tabel 1 + Tabel 1B) ----------
export function parseDestinations(dataDir: string): ParsedDestination[] {
  const md = fs.readFileSync(path.join(dataDir, "master-database-lengkap.md"), "utf-8");
  const tables = parseAllTables(md);

  const t1 = findTable(tables, "nama"); // Tabel 1 (punya kolom 'nama')
  const t1b = findTable(tables, "alamatLengkap"); // Tabel 1B
  if (!t1) throw new Error("Tabel 1 (atribut destinasi) tidak ditemukan");
  if (!t1b) throw new Error("Tabel 1B (detail destinasi) tidak ditemukan");

  const idx1 = (name: string) => t1.headers.indexOf(name);
  const idx1b = (name: string) => t1b.headers.indexOf(name);

  // map detail by code
  const detailByCode = new Map<string, string[]>();
  for (const r of t1b.rows) detailByCode.set(r[idx1b("id")], r);

  const result: ParsedDestination[] = [];
  for (const r of t1.rows) {
    const code = r[idx1("id")];
    const d = detailByCode.get(code);
    if (!d) throw new Error(`Detail (Tabel 1B) untuk ${code} tidak ada`);

    const fasilitasArr = r[idx1("fasilitas")].split(",").map((x) => x.trim()).filter(Boolean);
    const tipsArr = d[idx1b("tipsRombongan")].split(";").map((x) => x.trim()).filter(Boolean);

    result.push({
      code,
      nama: r[idx1("nama")],
      kategori: r[idx1("kategori")],
      wilayah: r[idx1("wilayah")],
      latitude: toNum(r[idx1("latitude")]),
      longitude: toNum(r[idx1("longitude")]),
      waktuKunjunganIdeal: r[idx1("waktuKunjunganIdeal")].trim().toUpperCase(),
      durasiKunjungan: toNum(r[idx1("durasiKunjungan")]),
      hargaTiket: Math.round(toNum(r[idx1("hargaTiket")])),
      rating: toNum(r[idx1("rating")]),
      imageUrl: r[idx1("imageUrl")],
      aksesBus: toBool(r[idx1("aksesBus")]),
      bolehDrone: toBool(r[idx1("bolehDrone")]),
      jarakPusat: toNum(r[idx1("jarakPusat")]),
      kulinerLokal: r[idx1("kulinerLokal")],
      deskripsi: r[idx1("deskripsi")],
      fasilitas: JSON.stringify(fasilitasArr),
      alamatLengkap: d[idx1b("alamatLengkap")],
      jamBuka: d[idx1b("jamBuka")],
      jamTutup: d[idx1b("jamTutup")],
      tipsRombongan: JSON.stringify(tipsArr),
      deskripsiPanjang: d[idx1b("deskripsiPanjang")],
    });
  }
  return result;
}

// ---------- Parser: Skor TOPSIS (Tabel 2 -> 40 baris per destinasi) ----------
export function parseScores(dataDir: string): ParsedScore[] {
  const md = fs.readFileSync(path.join(dataDir, "master-database-lengkap.md"), "utf-8");
  const tables = parseAllTables(md);
  const t2 = findTable(tables, "K1_S1"); // Tabel 2 (header punya K1_S1)
  if (!t2) throw new Error("Tabel 2 (matriks skor) tidak ditemukan");

  const subKeys = t2.headers.slice(1); // kolom 1..40 (lewati 'id')
  const scores: ParsedScore[] = [];
  for (const r of t2.rows) {
    const destCode = r[0];
    for (let c = 0; c < subKeys.length; c++) {
      const subCriteriaKey = subKeys[c];
      scores.push({
        destCode,
        kriteriaKey: subCriteriaKey.split("_")[0], // K2_S1 -> K2
        subCriteriaKey,
        scoreValue: Math.round(toNum(r[c + 1])),
      });
    }
  }
  return scores;
}

// ---------- Parser: Hotel (tier dari heading '## TIER xxx') ----------
export function parseHotels(dataDir: string): ParsedHotel[] {
  const md = fs.readFileSync(path.join(dataDir, "master-data-hotel.md"), "utf-8");
  const lines = md.split(/\r?\n/);
  const hotels: ParsedHotel[] = [];
  let currentTier = "STANDARD";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tierMatch = line.match(/TIER\s+(PREMIUM|STANDARD|BUDGET)/i);
    if (tierMatch) {
      currentTier = tierMatch[1].toUpperCase();
      continue;
    }
    // baris data hotel: dimulai '|' dan kolom-1 berupa angka (ID)
    if (line.trim().startsWith("|") && !isSeparator(line)) {
      const cells = splitRow(line);
      // header tabel hotel kolom-0 = "ID"; data kolom-0 = angka
      if (cells.length >= 10 && /^\d+$/.test(cells[0])) {
        const fasilitasArr = cells[8].split(",").map((x) => x.trim()).filter(Boolean);
        hotels.push({
          nama: cells[1],
          alamat: cells[2],
          wilayah: cells[3],
          latitude: toNum(cells[4]),
          longitude: toNum(cells[5]),
          rating: toNum(cells[6]),
          hargaPerMalam: Math.round(toNum(cells[7])),
          fasilitas: JSON.stringify(fasilitasArr),
          imageUrl: "/images/lodging/" + cells[9],
          tier: currentTier,
        });
      }
    }
  }
  return hotels;
}

// ---------- Parser: Kuliner ----------
export function parseKuliner(dataDir: string): ParsedKuliner[] {
  const md = fs.readFileSync(path.join(dataDir, "master-data-kuliner.md"), "utf-8");
  const tables = parseAllTables(md);
  const t = findTable(tables, "Nama Tempat");
  if (!t) throw new Error("Tabel Kuliner tidak ditemukan");
  const idx = (name: string) => t.headers.indexOf(name);

  return t.rows.map((r) => ({
    nama: r[idx("Nama Tempat")],
    jenis: r[idx("Jenis")],
    alamat: r[idx("Alamat")],
    latitude: toNum(r[idx("Lat")]),
    longitude: toNum(r[idx("Long")]),
    hargaRataRata: Math.round(toNum(r[idx("Harga (Rp)")])),
    rating: toNum(r[idx("Rating")]),
  }));
}
