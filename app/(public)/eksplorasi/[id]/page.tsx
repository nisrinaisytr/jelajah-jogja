// app/(public)/eksplorasi/[id]/page.tsx
// Detail wisata. Server Component: ambil destinasi + skor, hitung snapshot rata-rata per kriteria utama.
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicNavbar from "@/components/PublicNavbar";
import DestImage from "@/components/DestImage";
import { formatRupiah, kategoriEmoji } from "@/lib/destinasi-helpers";

export const dynamic = "force-dynamic";

const SNAPSHOT_CRITERIA: { key: string; nama: string }[] = [
  { key: "K2", nama: "Biaya & Keterjangkauan" },
  { key: "K3", nama: "Aksesibilitas" },
  { key: "K5", nama: "Daya Tarik & Pengalaman" },
  { key: "K8", nama: "Kesesuaian untuk Grup" },
];

function safeArray(json: string | null): string[] {
  if (!json) return [];
  try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const dest = await prisma.destination.findUnique({
    where: { id },
    include: { scores: true },
  });
  if (!dest) notFound();

  // hitung rata-rata skor per kriteria utama (1-5)
  const snapshot = SNAPSHOT_CRITERIA.map((c) => {
    const vals = dest.scores.filter((s) => s.kriteriaKey === c.key).map((s) => s.scoreValue);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { ...c, avg };
  });

  const fasilitas = safeArray(dest.fasilitas);
  const tips = safeArray(dest.tipsRombongan);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicNavbar />

      {/* HERO */}
      <section className="hero-gradient relative h-[320px] text-white">
        <DestImage src={dest.imageUrl} alt={dest.nama} kategori={dest.kategori} className="absolute inset-0 h-full w-full opacity-30" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-8">
          <Link href="/eksplorasi" className="mb-3 w-fit text-sm font-semibold text-white/90 hover:underline">← Kembali ke Eksplorasi</Link>
          <span className="mb-2 w-fit rounded-full bg-[#FF5E1F] px-3 py-0.5 text-xs font-bold">{kategoriEmoji(dest.kategori)} {dest.kategori}</span>
          <h1 className="text-3xl font-extrabold md:text-4xl">{dest.nama}</h1>
          <p className="mt-1 text-blue-100">📍 {dest.wilayah} • {dest.jarakPusat} km dari pusat • ⭐ {dest.rating}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 md:grid-cols-[1fr_340px]">
        {/* KIRI */}
        <div className="space-y-6">
          {/* Deskripsi */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-slate-800">Tentang Destinasi</h2>
            <p className="leading-relaxed text-slate-600">{dest.deskripsiPanjang || dest.deskripsi}</p>
          </div>

          {/* Spek Pak Ucup */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-800">Spesifikasi Logistik (Pak Ucup)</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className={`rounded-xl p-3 text-center ${dest.aksesBus ? "bg-[#ECFDF5]" : "bg-slate-50"}`}>
                <div className="text-2xl">🚌</div>
                <div className="mt-1 text-xs text-slate-500">Akses Bus</div>
                <div className={`text-sm font-bold ${dest.aksesBus ? "text-[#10B981]" : "text-slate-400"}`}>{dest.aksesBus ? "Bisa" : "Tidak"}</div>
              </div>
              <div className={`rounded-xl p-3 text-center ${dest.bolehDrone ? "bg-[#E6F4FE]" : "bg-slate-50"}`}>
                <div className="text-2xl">🚁</div>
                <div className="mt-1 text-xs text-slate-500">Boleh Drone</div>
                <div className={`text-sm font-bold ${dest.bolehDrone ? "text-[#0194F3]" : "text-slate-400"}`}>{dest.bolehDrone ? "Boleh" : "Tidak"}</div>
              </div>
              <div className="rounded-xl bg-[#FFF1EC] p-3 text-center">
                <div className="text-2xl">📍</div>
                <div className="mt-1 text-xs text-slate-500">Jarak Pusat</div>
                <div className="text-sm font-bold text-[#FF5E1F]">{dest.jarakPusat} km</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-2xl">🍴</div>
                <div className="mt-1 text-xs text-slate-500">Kuliner Lokal</div>
                <div className="text-[11px] font-semibold text-slate-600">{dest.kulinerLokal || "-"}</div>
              </div>
            </div>
          </div>

          {/* Fasilitas */}
          {fasilitas.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-bold text-slate-800">Fasilitas</h2>
              <div className="flex flex-wrap gap-2">
                {fasilitas.map((f) => (
                  <span key={f} className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-semibold text-[#10B981]">✓ {f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Snapshot skor */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-bold text-slate-800">Snapshot Penilaian</h2>
            <p className="mb-4 text-xs text-slate-400">Rata-rata skor pakar (skala 1-5) untuk 4 kriteria utama.</p>
            <div className="space-y-3">
              {snapshot.map((s) => (
                <div key={s.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{s.nama}</span>
                    <span className="font-bold text-slate-800">{s.avg.toFixed(1)}/5</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#0194F3]" style={{ width: `${(s.avg / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="h-fit md:sticky md:top-20">
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div>
              <div className="text-xs text-slate-400">Harga Tiket Masuk</div>
              <div className="text-2xl font-extrabold text-[#FF5E1F]">{formatRupiah(dest.hargaTiket)}</div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-400">Jam Operasional</div>
              <div className="font-bold text-slate-800">🕐 {dest.jamBuka} - {dest.jamTutup}</div>
            </div>
            {dest.alamatLengkap && (
              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs text-slate-400">Alamat</div>
                <div className="text-sm text-slate-600">{dest.alamatLengkap}</div>
              </div>
            )}
            {tips.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-2 text-xs font-bold uppercase text-slate-400">Tips Rombongan</div>
                <ul className="space-y-2">
                  {tips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600"><span>💡</span><span>{t}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <Link href="/register" className="orange-gradient block rounded-xl py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl">
              👑 Buat Grup dengan Wisata Ini
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
