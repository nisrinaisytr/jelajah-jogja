// lib/extract-kota.ts
// Ekstraksi kotaAsal dari alamat lengkap saat registrasi (02-database-schema §3C).
// kotaAsal dipakai untuk peta Leaflet & geographic analytics. JANGAN scan User.alamat saat query.

export const DAFTAR_KOTA = [
  "Jakarta", "Bandung", "Surabaya", "Solo", "Yogyakarta",
  "Semarang", "Medan", "Makassar", "Denpasar", "Malang", "Bekasi", "Tangerang",
  "Depok", "Bogor", "Palembang", "Pekanbaru", "Bandar Lampung",
];

export function extractKota(alamat: string): string | null {
  const lower = alamat.toLowerCase();
  for (const kota of DAFTAR_KOTA) {
    if (lower.includes(kota.toLowerCase())) return kota;
  }
  return null;
}
