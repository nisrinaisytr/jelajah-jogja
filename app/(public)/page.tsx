// app/(public)/page.tsx
// Landing publik. Server Component: ambil destinasi populer dari DB untuk hero carousel + grid.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PublicNavbar from "@/components/PublicNavbar";
import DestImage from "@/components/DestImage";
import HeroCarousel from "@/components/HeroCarousel";
import { formatRupiah } from "@/lib/destinasi-helpers";

export const dynamic = "force-dynamic";

// Foto latar hero (ganti ke nama file lain di /public/images/destinations/ kalau mau)
const HERO_BG = "/images/destinations/candi-prambanan.jpg";

export default async function LandingPage() {
  const populer = await prisma.destination.findMany({
    orderBy: { rating: "desc" },
    take: 6,
    select: { id: true, nama: true, kategori: true, wilayah: true, hargaTiket: true, rating: true, imageUrl: true, jarakPusat: true },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicNavbar />

      {/* HERO — foto wisata di belakang + overlay biru (lebih pekat di kiri agar teks terbaca) */}
      <section className="relative overflow-hidden text-white">
        <div className="hero-gradient absolute inset-0" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${HERO_BG}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0194F3]/95 via-[#0194F3]/80 to-[#0277C2]/55" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="mb-5 inline-block rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold backdrop-blur-sm">
              ✨ Sistem Pendukung Keputusan Kolaboratif
            </span>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Pilih Wisata Bareng Tanpa <span className="text-yellow-300">Debat Panjang</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-blue-50 drop-shadow">
              Platform berbasis BWM-TOPSIS yang menyatukan preferensi seluruh anggota rombongan
              menjadi 1 rekomendasi paket wisata Yogyakarta terbaik.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="orange-gradient rounded-xl px-7 py-4 text-center font-bold text-white shadow-lg transition hover:shadow-xl">
                👑 Buat Grup Baru →
              </Link>
              <Link href="/login" className="rounded-xl border border-white/30 bg-white/15 px-7 py-4 text-center font-bold backdrop-blur-sm transition hover:bg-white/25">
                🤝 Gabung Grup
              </Link>
            </div>
            <p className="mt-4 text-xs text-blue-100">💡 Belum punya akun? Daftar gratis dengan email saat klik tombol di atas.</p>
          </div>

          {/* Carousel 3 destinasi populer (foto asli, bisa digeser) */}
          <div className="hidden md:block">
            <HeroCarousel destinations={populer} />
          </div>
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="bg-white py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="mb-6 text-2xl font-extrabold text-slate-900">3 Langkah Mudah</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["1", "Daftar & Buat Grup", "Tentukan durasi tour (1H/2D1N/3D2N) & kriteria penting"],
              ["2", "Bagikan Kode Grup", "Anggota join via kode JJ-XXXX & isi kuesioner"],
              ["3", "Dapatkan Rekomendasi", "Top 10 destinasi & 3 paket wisata otomatis"],
            ].map(([no, judul, desc]) => (
              <div key={no} className="rounded-2xl bg-slate-50 p-5">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0194F3] text-xl font-bold text-white">{no}</div>
                <div className="mb-1 font-bold">{judul}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULER DI JOGJA */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <span className="mb-1 block text-xs font-bold text-[#FF5E1F]">🔥 POPULER DI JOGJA</span>
              <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Destinasi Paling Diminati</h2>
              <p className="mt-1 text-sm text-slate-500">Wisata teratas pilihan pengunjung</p>
            </div>
            <Link href="/eksplorasi" className="flex items-center gap-1 text-sm font-semibold text-[#0194F3] hover:underline">
              Lihat Semua →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {populer.map((d) => (
              <Link key={d.id} href={`/eksplorasi/${d.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <DestImage src={d.imageUrl} alt={d.nama} kategori={d.kategori} className="h-full w-full" />
                  <div className="absolute left-2 top-2 rounded-full bg-[#FF5E1F] px-2.5 py-0.5 text-[10px] font-bold text-white">{d.kategori}</div>
                  <div className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-0.5 text-[10px] font-bold">⭐ {d.rating}</div>
                </div>
                <div className="p-4">
                  <div className="mb-1 text-sm font-bold text-slate-900">{d.nama}</div>
                  <div className="mb-2 text-[10px] text-slate-500">📍 {d.wilayah} • {d.jarakPusat} km</div>
                  <div className="text-sm font-bold text-[#FF5E1F]">{formatRupiah(d.hargaTiket)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white py-8 text-center text-sm text-slate-400">
        © 2026 Jelajah Jogja — SPK Kolaboratif BWM-TOPSIS
      </footer>
    </div>
  );
}
