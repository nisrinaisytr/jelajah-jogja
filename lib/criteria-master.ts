// lib/criteria-master.ts
// Konstanta master 8 kriteria + 40 subkriteria. Di-hardcode (TIDAK masuk DB) sesuai 02-database-schema §5.
// Dipakai untuk pre-filtering (Wizard Buat Grup) & label kuesioner BWM.

export interface SubCriteria {
  key: string; // "K1_S1"
  nama: string;
}
export interface Criteria {
  key: string; // "K1"
  nama: string;
  wajib: boolean; // K2, K3, K8 = wajib (tidak bisa dihapus Leader)
  subKriteria: SubCriteria[];
}

export const CRITERIA_MASTER: Criteria[] = [
  {
    key: "K1", nama: "Jenis & Tema Wisata", wajib: false,
    subKriteria: [
      { key: "K1_S1", nama: "Wisata Alam" },
      { key: "K1_S2", nama: "Wisata Budaya & Heritage" },
      { key: "K1_S3", nama: "Wisata Edukasi" },
      { key: "K1_S4", nama: "Wisata Petualangan & Aktif" },
      { key: "K1_S5", nama: "Wisata Relaksasi & Healing" },
    ],
  },
  {
    key: "K2", nama: "Biaya & Keterjangkauan", wajib: true,
    subKriteria: [
      { key: "K2_S1", nama: "Harga Tiket Masuk" },
      { key: "K2_S2", nama: "Estimasi Biaya Total/Orang" },
      { key: "K2_S3", nama: "Paket Grup / Diskon Rombongan" },
      { key: "K2_S4", nama: "Transparansi Biaya" },
      { key: "K2_S5", nama: "Value for Money" },
    ],
  },
  {
    key: "K3", nama: "Aksesibilitas", wajib: true,
    subKriteria: [
      { key: "K3_S1", nama: "Jarak dari Pusat Kota" },
      { key: "K3_S2", nama: "Kondisi & Kualitas Jalan" },
      { key: "K3_S3", nama: "Navigasi & Parkir" },
      { key: "K3_S4", nama: "Jam & Jadwal Kunjungan" },
      { key: "K3_S5", nama: "Transportasi Umum" },
    ],
  },
  {
    key: "K4", nama: "Fasilitas & Kenyamanan", wajib: false,
    subKriteria: [
      { key: "K4_S1", nama: "Sanitasi & Ibadah" },
      { key: "K4_S2", nama: "Makan & Istirahat" },
      { key: "K4_S3", nama: "Keamanan & Informasi" },
      { key: "K4_S4", nama: "Inklusif & Ramah Segmen" },
      { key: "K4_S5", nama: "Konektivitas & Utilitas" },
    ],
  },
  {
    key: "K5", nama: "Daya Tarik & Pengalaman", wajib: false,
    subKriteria: [
      { key: "K5_S1", nama: "Visual & Potensi Konten" },
      { key: "K5_S2", nama: "Keunikan & Kekhasan" },
      { key: "K5_S3", nama: "Aktivitas & Interaktivitas" },
      { key: "K5_S4", nama: "Reputasi & Ulasan" },
      { key: "K5_S5", nama: "Nilai Edukasi & Wawasan" },
    ],
  },
  {
    key: "K6", nama: "Keamanan & Keselamatan", wajib: false,
    subKriteria: [
      { key: "K6_S1", nama: "Keamanan Lingkungan" },
      { key: "K6_S2", nama: "SOP Keselamatan Aktivitas" },
      { key: "K6_S3", nama: "Kesiapan Tanggap Darurat" },
      { key: "K6_S4", nama: "Keamanan Infrastruktur" },
      { key: "K6_S5", nama: "Pencahayaan Area" },
    ],
  },
  {
    key: "K7", nama: "Kebersihan & Kelestarian", wajib: false,
    subKriteria: [
      { key: "K7_S1", nama: "Kebersihan Area Wisata" },
      { key: "K7_S2", nama: "Kebersihan Fasilitas Sanitasi" },
      { key: "K7_S3", nama: "Pengelolaan Sampah & Limbah" },
      { key: "K7_S4", nama: "Konservasi & Pelestarian" },
      { key: "K7_S5", nama: "Kualitas Udara & Lingkungan" },
    ],
  },
  {
    key: "K8", nama: "Kesesuaian untuk Grup", wajib: true,
    subKriteria: [
      { key: "K8_S1", nama: "Kapasitas Rombongan" },
      { key: "K8_S2", nama: "Aktivitas Kelompok" },
      { key: "K8_S3", nama: "Guide & Koordinasi" },
      { key: "K8_S4", nama: "Kesesuaian Segmen Usia" },
      { key: "K8_S5", nama: "Dokumentasi & Kebersamaan" },
    ],
  },
];

export const WAJIB_CRITERIA = CRITERIA_MASTER.filter((c) => c.wajib).map((c) => c.key); // ["K2","K3","K8"]
export const MIN_OPSIONAL = 2; // minimal 2 kriteria opsional
export const MAX_DESTINATIONS_PER_DAY = 3; // ergonomi Pak Ucup

export function getCriteria(key: string): Criteria | undefined {
  return CRITERIA_MASTER.find((c) => c.key === key);
}
