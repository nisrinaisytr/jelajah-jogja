// components/WaitingRoom.tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/destinasi-helpers";

interface Member { nama: string; hasSubmitted: boolean; isLeader: boolean; isMe: boolean }
interface Status {
  groupName: string; groupCode: string; status: string;
  members: Member[]; total: number; submitted: number; allSubmitted: boolean; calculated: boolean;
  top5: { nama: string; ciScore: number; ranking: number }[];
  packages: { nama: string; variant: string; harga: number }[];
}

export default function WaitingRoom({ groupCode }: { groupCode: string }) {
  const [data, setData] = useState<Status | null>(null);
  const [err, setErr] = useState("");
  const calculatingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/group/${groupCode}/status`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "Gagal memuat status"); return; }
      setData(d);

      // Auto-kalkulasi saat semua submit & belum dihitung
      if (d.allSubmitted && !d.calculated && !calculatingRef.current) {
        calculatingRef.current = true;
        const r = await fetch("/api/group/calculate", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupCode }),
        });
        calculatingRef.current = false;
        if (r.ok) fetchStatus();
      }
    } catch { setErr("Kesalahan jaringan"); }
  }, [groupCode]);

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 5000); // polling 5 detik
    return () => clearInterval(t);
  }, [fetchStatus]);

  if (err) return <main className="mx-auto max-w-lg px-6 py-16 text-center text-red-600">{err}</main>;
  if (!data) return <main className="mx-auto max-w-lg px-6 py-16 text-center text-slate-400">Memuat...</main>;

  const pct = data.total ? Math.round((data.submitted / data.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/home" className="text-sm font-semibold text-slate-500 hover:underline">← Beranda</Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{data.groupName}</h1>
          <p className="font-mono text-sm font-bold text-[#0194F3]">{data.groupCode}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        {data.calculated ? (
          <>
            <div className="text-5xl">🎉</div>
            <h2 className="mt-2 text-xl font-extrabold text-slate-900">Perhitungan Selesai!</h2>
            <p className="mt-1 text-sm text-slate-500">Semua anggota sudah mengisi. Peringkat destinasi sudah dihitung.</p>
          </>
        ) : (
          <>
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#0194F3" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
                  style={{ transition: "stroke-dashoffset .5s" }} />
              </svg>
              <span className="absolute text-2xl font-extrabold text-slate-800">{pct}%</span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-800">Menunggu Anggota Mengisi</h2>
            <p className="mt-1 text-sm text-slate-500">{data.submitted} dari {data.total} anggota selesai. Halaman ini menyegar otomatis.</p>
          </>
        )}
      </div>

      {/* Daftar anggota */}
      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Anggota Grup</h3>
        <div className="space-y-2">
          {data.members.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0194F3] text-xs font-bold text-white">{m.nama[0]?.toUpperCase()}</span>
                {m.nama} {m.isLeader && <span className="rounded bg-[#FFF1EC] px-1.5 py-0.5 text-[10px] font-bold text-[#FF5E1F]">👑 Leader</span>}
                {m.isMe && <span className="text-[10px] text-slate-400">(kamu)</span>}
              </span>
              {m.hasSubmitted
                ? <span className="text-xs font-bold text-[#10B981]">✓ Selesai</span>
                : <span className="text-xs font-bold text-[#F59E0B]">⏳ Mengisi</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 preview + lanjut */}
      {data.calculated && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Top 5 Destinasi (TOPSIS)</h3>
          <div className="space-y-2">
            {data.top5.map((d) => (
              <div key={d.ranking} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981] text-xs font-bold text-white">{d.ranking}</span>
                  {d.nama}
                </span>
                <span className="text-xs font-bold text-[#0194F3]">{(d.ciScore * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          {data.packages.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">3 Paket Wisata Otomatis</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {data.packages.map((p) => (
                  <div key={p.variant} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <div className="text-xs font-bold text-[#FF5E1F]">{p.variant}</div>
                    <div className="mt-1 text-sm font-bold text-slate-800">{formatRupiah(p.harga)}</div>
                    <div className="text-[10px] text-slate-400">/orang</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Link href={`/results/${groupCode}`} className="orange-gradient mt-4 block rounded-xl py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl">
            Lihat Hasil Lengkap & Itinerary →
          </Link>
          <p className="mt-2 text-center text-xs text-slate-400">Halaman hasil interaktif (itinerary + ketuk palu) di tahap berikutnya.</p>
        </div>
      )}
    </main>
  );
}
