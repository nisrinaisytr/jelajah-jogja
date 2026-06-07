// components/WaitingRoom.tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/destinasi-helpers";

interface Member { nama: string; noTelp: string | null; hasSubmitted: boolean; isLeader: boolean; isMe: boolean }
interface Status {
  groupName: string; groupCode: string; status: string;
  members: Member[]; total: number; quota: number; joined: number; submitted: number;
  allSubmitted: boolean; canLeaderStart: boolean; calculated: boolean;
  top5: { nama: string; ciScore: number; ranking: number }[];
  packages: { nama: string; variant: string; harga: number }[];
}

function waLink(phone: string, text: string) {
  let p = (phone || "").replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export default function WaitingRoom({ groupCode }: { groupCode: string }) {
  const [data, setData] = useState<Status | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const calculatingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/group/${groupCode}/status`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "Gagal memuat status"); return; }
      setData(d);
      // Auto-kalkulasi saat kuota penuh & semua submit
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
    const t = setInterval(fetchStatus, 5000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  async function startNow() {
    if (!confirm("Mulai hitung sekarang dengan anggota yang sudah hadir? Anggota yang belum bergabung tidak akan ikut.")) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/group/calculate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupCode }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Gagal memulai perhitungan"); return; }
      fetchStatus();
    } catch { setErr("Kesalahan jaringan"); }
    finally { setBusy(false); }
  }

  if (err) return <main className="mx-auto max-w-lg px-6 py-16 text-center text-red-600">{err}</main>;
  if (!data) return <main className="mx-auto max-w-lg px-6 py-16 text-center text-slate-400">Memuat...</main>;

  const pct = data.quota ? Math.round((data.submitted / data.quota) * 100) : 0;
  const me = data.members.find((m) => m.isMe);
  const iAmLeader = !!me?.isLeader;
  const belumGabung = Math.max(data.quota - data.joined, 0);

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/home" className="text-sm font-semibold text-slate-500 hover:underline">← Beranda</Link>
      <div className="mt-2">
        <h1 className="text-2xl font-extrabold text-slate-900">{data.groupName}</h1>
        <p className="font-mono text-sm font-bold text-[#0194F3]">{data.groupCode}</p>
      </div>

      {/* Progress */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        {data.calculated ? (
          <>
            <div className="text-5xl">🎉</div>
            <h2 className="mt-2 text-xl font-extrabold text-slate-900">Perhitungan Selesai!</h2>
            <p className="mt-1 text-sm text-slate-500">Peringkat destinasi & paket sudah dihitung.</p>
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
            <h2 className="mt-3 text-lg font-bold text-slate-800">Menunggu Anggota</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{data.joined}/{data.quota}</b> bergabung • <b>{data.submitted}/{data.quota}</b> mengisi kuesioner
            </p>
            {belumGabung > 0 && (
              <p className="mt-1 text-xs font-semibold text-[#F59E0B]">Masih menunggu {belumGabung} anggota lagi bergabung pakai kode.</p>
            )}
          </>
        )}
      </div>

      {/* Ajak anggota (bagikan kode) */}
      {!data.calculated && belumGabung > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[#0194F3]/40 bg-[#E6F4FE] p-4">
          <div className="text-sm text-slate-600">Ajak anggota bergabung dengan kode: <span className="font-mono text-base font-extrabold text-[#0277C2]">{data.groupCode}</span></div>
          <button onClick={() => { navigator.clipboard?.writeText(data.groupCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="rounded-lg bg-[#0194F3] px-3 py-1.5 text-xs font-bold text-white hover:brightness-95">
            {copied ? "✓ Tersalin" : "📋 Salin Kode"}
          </button>
        </div>
      )}

      {/* Tombol Leader: mulai hitung manual */}
      {iAmLeader && data.canLeaderStart && !data.calculated && (
        <button onClick={startNow} disabled={busy}
          className="orange-gradient mt-4 w-full rounded-xl py-3 font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">
          {busy ? "Memproses..." : `🚀 Mulai Hitung Sekarang (${data.submitted} anggota hadir)`}
        </button>
      )}

      {/* Daftar anggota */}
      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Anggota Bergabung ({data.joined}/{data.quota})</h3>
        <div className="space-y-2">
          {data.members.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0194F3] text-xs font-bold text-white">{m.nama[0]?.toUpperCase()}</span>
                {m.nama} {m.isLeader && <span className="rounded bg-[#FFF1EC] px-1.5 py-0.5 text-[10px] font-bold text-[#FF5E1F]">👑 Leader</span>}
                {m.isMe && <span className="text-[10px] text-slate-400">(kamu)</span>}
              </span>
              <span className="flex items-center gap-2">
                {/* Leader bisa ingatkan anggota yang belum mengisi via WhatsApp */}
                {iAmLeader && !m.isMe && !m.hasSubmitted && m.noTelp && (
                  <a href={waLink(m.noTelp, `Halo ${m.nama}! Kamu diundang ke grup tour "${data.groupName}" (kode ${data.groupCode}) di Jelajah Jogja. Yuk segera isi kuesionernya ya 🙏`)}
                    target="_blank" rel="noopener noreferrer"
                    className="rounded-lg bg-[#25D366] px-2 py-1 text-[10px] font-bold text-white hover:brightness-95">📱 Ingatkan</a>
                )}
                {m.hasSubmitted
                  ? <span className="text-xs font-bold text-[#10B981]">✓ Selesai</span>
                  : <span className="text-xs font-bold text-[#F59E0B]">⏳ Mengisi</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hasil */}
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
              <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">3 Opsi Paket</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {data.packages.map((p) => (
                  <div key={p.variant} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <div className="text-xs font-bold text-[#FF5E1F]">{p.nama}</div>
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
        </div>
      )}
    </main>
  );
}
