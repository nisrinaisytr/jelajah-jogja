// components/admin/LiveTracker.tsx
"use client";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/destinasi-helpers";

interface Member { nama: string; hasSubmitted: boolean; isLeader: boolean }
interface Grp { id: number; code: string; name: string; status: string; leader: string; quota: number; joined: number; submitted: number; members: Member[]; finalPaket: string | null; revenue: number }
interface Stats { inProgressToday: number; completedToday: number; bookedToday: number; totalUsers: number; totalGroups: number }
interface Pkg { id: number; nama: string; harga: number; durasiHari: number; armada: string; hotel: string; destinations: string[] }
interface Detail { status: string; code: string; name: string; leader: string; quota: number; joined: number; submitted: number; finalPackageId: number | null; members: Member[]; packages: Pkg[] }

const STATUS: Record<string, { label: string; cls: string; ring: string }> = {
  IN_PROGRESS: { label: "Berlangsung", cls: "bg-[#FEF3C7] text-[#B45309]", ring: "border-slate-200" },
  COMPLETED: { label: "Belum Ketuk Palu", cls: "bg-[#FEF3C7] text-[#B45309]", ring: "border-[#F59E0B]/40" },
  BOOKED: { label: "Dipesan", cls: "bg-[#E6F4FE] text-[#0277C2]", ring: "border-[#0194F3]" },
};

function Card({ icon, label, value, sub, accent }: { icon: string; label: string; value: number; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${accent}`}>{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

export default function LiveTracker({ initialStats, initialGroups }: { initialStats: Stats; initialGroups: Grp[] }) {
  const [stats, setStats] = useState(initialStats);
  const [groups, setGroups] = useState(initialGroups);
  const [sel, setSel] = useState<Grp | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/admin/live", { cache: "no-store" });
        if (r.ok) { const d = await r.json(); setStats(d.stats); setGroups(d.groups); }
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [live]);

  async function openGroup(g: Grp) {
    setSel(g); setDetail(null); setLoadingDetail(true);
    try {
      const r = await fetch(`/api/admin/groups/${g.id}`, { cache: "no-store" });
      if (r.ok) setDetail(await r.json());
    } catch {} finally { setLoadingDetail(false); }
  }

  return (
    <div className="px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">📊 Live Collaboration Tracker</h1>
          <p className="text-sm text-slate-500">Pantau aktivitas grup secara real-time.</p>
        </div>
        <button onClick={() => setLive((v) => !v)}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${live ? "bg-[#ECFDF5] text-[#047857]" : "bg-slate-100 text-slate-500"}`}>
          <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-[#10B981]" : "bg-slate-400"}`} />
          {live ? "LIVE" : "Jeda"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon="⏳" label="Grup Berlangsung (hari ini)" value={stats.inProgressToday} accent="bg-[#FEF3C7]" />
        <Card icon="✅" label="Grup Selesai (hari ini)" value={stats.completedToday} accent="bg-[#ECFDF5]" />
        <Card icon="🎟️" label="Grup Dipesan (hari ini)" value={stats.bookedToday} accent="bg-[#E6F4FE]" />
        <Card icon="🧳" label="Total Wisatawan" value={stats.totalUsers} sub={`${stats.totalGroups} grup keseluruhan`} accent="bg-[#FFF1EC]" />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold uppercase text-slate-400">Grup Terbaru</h2>
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">Belum ada grup.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => {
            const s = STATUS[g.status] ?? STATUS.IN_PROGRESS;
            const pct = g.quota ? Math.round((g.submitted / g.quota) * 100) : 0;
            return (
              <button key={g.id} onClick={() => openGroup(g)}
                className={`rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${s.ring}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-700">{g.code}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
                </div>
                <div className="mt-1 font-bold text-slate-800">{g.name}</div>
                <div className="text-xs text-slate-500">👑 {g.leader}</div>

                {/* Indikator menyesuaikan status */}
                {g.status === "IN_PROGRESS" ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Progres pengisian</span><span>{g.submitted}/{g.quota}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#0194F3]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : g.status === "COMPLETED" ? (
                  <div className="mt-3 rounded-lg bg-[#FEF3C7] px-3 py-2 text-xs font-semibold text-[#B45309]">
                    ✓ Kuesioner lengkap • ⏳ menunggu Leader ketuk palu
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-[#E6F4FE] px-3 py-2 text-xs font-semibold text-[#0277C2]">
                    <span>✅ {g.finalPaket ?? "Paket dipilih"}</span>
                    {g.revenue > 0 && <span className="font-bold">{formatRupiah(g.revenue)}</span>}
                  </div>
                )}

                <div className="mt-3 flex -space-x-2">
                  {g.members.slice(0, 6).map((m, i) => (
                    <span key={i} title={m.nama}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${m.hasSubmitted ? "bg-[#10B981]" : "bg-slate-300"}`}>
                      {m.nama[0]?.toUpperCase()}
                    </span>
                  ))}
                  {g.joined > 6 && <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500">+{g.joined - 6}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal detail */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSel(null)}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-sm font-bold text-[#0194F3]">{sel.code}</div>
                <h3 className="text-lg font-extrabold text-slate-900">{sel.name}</h3>
                <div className="text-xs text-slate-500">👑 {sel.leader} • kuota {sel.quota} • {sel.joined} bergabung</div>
              </div>
              <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Status besar */}
            <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${sel.status === "BOOKED" ? "bg-[#E6F4FE] text-[#0277C2]" : sel.status === "COMPLETED" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-slate-100 text-slate-600"}`}>
              {sel.status === "BOOKED" ? "✅ Sudah dipesan (Leader telah ketuk palu)" : sel.status === "COMPLETED" ? "⏳ Selesai mengisi — menunggu Leader ketuk palu" : "📝 Sedang mengisi kuesioner"}
            </div>

            {loadingDetail ? (
              <div className="py-8 text-center text-sm text-slate-400">Memuat detail...</div>
            ) : detail ? (
              <>
                <h4 className="mt-4 mb-2 text-xs font-bold uppercase text-slate-400">Status Pengisian</h4>
                <div className="space-y-1.5">
                  {detail.members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-700">{m.nama} {m.isLeader && <span className="text-[10px] text-[#FF5E1F]">👑</span>}</span>
                      {m.hasSubmitted ? <span className="text-xs font-bold text-[#10B981]">✓ Selesai</span> : <span className="text-xs font-bold text-[#F59E0B]">⏳ Mengisi</span>}
                    </div>
                  ))}
                </div>

                {detail.packages.length > 0 && (
                  <>
                    <h4 className="mt-4 mb-2 text-xs font-bold uppercase text-slate-400">Opsi Paket {detail.finalPackageId ? "(✅ = terpilih)" : "(belum dipilih Leader)"}</h4>
                    <div className="space-y-2">
                      {detail.packages.map((p) => {
                        const chosen = detail.finalPackageId === p.id;
                        return (
                          <div key={p.id} className={`rounded-xl border p-3 ${chosen ? "border-[#0194F3] bg-[#E6F4FE]" : "border-slate-100"}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{chosen && "✅ "}{p.nama}</span>
                              <span className="text-sm font-extrabold text-slate-900">{formatRupiah(p.harga)}<span className="text-[10px] font-normal text-slate-400">/org</span></span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">🏨 {p.hotel} • {p.durasiHari} hari • {p.armada}</div>
                            <div className="mt-1 text-[11px] text-slate-500">📍 {p.destinations.join(" → ")}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">Gagal memuat detail.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
