// lib/destinasi-helpers.ts
// Helper tampilan untuk halaman publik (warna/emoji per kategori, format harga, daftar filter).

export const KATEGORI_LIST = ["Alam", "Budaya", "Edukasi", "Petualangan", "Relaksasi"];
export const WILAYAH_LIST = ["Sleman", "Bantul", "Kota", "Gunungkidul", "Kulon Progo"];

export const RATING_OPTIONS = [
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4.0 },
  { label: "3.5+", value: 3.5 },
];

export const HARGA_BANDS = [
  { id: "b1", label: "< Rp 25rb", min: 0, max: 24999 },
  { id: "b2", label: "Rp 25rb - 50rb", min: 25000, max: 50000 },
  { id: "b3", label: "Rp 50rb - 100rb", min: 50001, max: 100000 },
  { id: "b4", label: "> Rp 100rb", min: 100001, max: 99999999 },
];

const EMOJI: Record<string, string> = {
  Alam: "🌲",
  Budaya: "🏛️",
  Edukasi: "🎓",
  Petualangan: "🧗",
  Relaksasi: "🌅",
};

const GRADIENT: Record<string, string> = {
  Alam: "from-green-200 to-emerald-400",
  Budaya: "from-amber-200 to-orange-300",
  Edukasi: "from-blue-200 to-cyan-300",
  Petualangan: "from-orange-200 to-red-300",
  Relaksasi: "from-violet-200 to-purple-300",
};

export function kategoriEmoji(kategori: string): string {
  return EMOJI[kategori] ?? "📍";
}

export function kategoriGradient(kategori: string): string {
  return GRADIENT[kategori] ?? "from-slate-200 to-slate-300";
}

export function formatRupiah(n: number): string {
  if (!n || n <= 0) return "Gratis";
  return "Rp " + n.toLocaleString("id-ID");
}
