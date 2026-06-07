// components/ResultsView.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DestImage from "@/components/DestImage";
import { formatRupiah } from "@/lib/destinasi-helpers";

interface Stop { urutanRute: number; estimasiJam: string; waktuKunjungan: string; jarakDariSebelum: number | null; dest: { id: number; nama: string; kategori: string; wilayah: string; hargaTiket: number; imageUrl: string } }
interface Day { hari: number; stops: Stop[] }
interface Kuliner { nama: string; jenis: string; rating: number; hargaRataRata: number }
interface Pkg {
  id: number; variant: string; namaPaket: string; hargaPerOrang: number; durasiHari: number; jenisArmada: string;
  hotel: { nama: string; tier: string; hargaPerMalam: number; rating: number; wilayah: string; alamat: string };
  days: Day[]; kuliner: Kuliner[];
}
interface Top { ranking: number; ciScore: number; nama: string; kategori: string; wilayah: string }

const TIER_INFO: Record<string, { warna: string; termasuk: string[] }> = {
  HEMAT: { warna: "text-[#10B981]", termasuk: ["Hotel kelas budget", "Bus ekonomi", "Tiket masuk semua destinasi"] },
  STANDARD: { warna: "text-[#0194F3]", termasuk: ["Hotel kelas standar", "Bus ber-AC", "Tiket masuk + 1x makan/hari"] },
  PREMIUM: { warna: "text-[#FF5E1F]", termasuk: ["Hotel kelas premium", "Minibus premium", "Tiket + makan + guide pribadi"] },
};

export default function ResultsView({ groupCode, groupName, status, isLeader, finalPackageId, packages, top10, members }: {
  groupCode: string; groupName: string; status: string; isLeader: boolean; finalPackageId: number | null;
  packages: Pkg[]; top10: Top[]; members: { nama: string; isLeader: boolean }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(packages[0]?.id ?? null);
  const [finalId, setFinalId] = useState<number | null>(finalPackageId);
  const [booked, setBooked] = useState(status === "BOOKED");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const maxCi = Math.max(...top10.map((t) => t.ciScore), 0.0001);

  async function ketukPalu(pkg: Pkg) {
    if (!confirm(`Pilih "${pkg.namaPaket}" sebagai paket final grup? Keputusan ini final dan akan terlihat oleh semua anggota.`)) return;
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/group/book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCode, packageId: pkg.id }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "Gagal memilih paket"); return; }
      setFinalId(pkg.id); setBooked(true); router.refresh();
    } catch { setErr("Kesalahan jaringan"); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/home" className="text-sm font-semibold text-slate-500 hover:underline">← Beranda</Link>

      {/* Banner */}
      <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#0194F3] to-[#0277C2] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-blue-100">{groupName} • {groupCode}</div>
            <h1 className="text-2xl font-extrabold">{booked ? "Paket Final Telah Dipilih 🎉" : "Hasil Rekomendasi Siap!"}</h1>
            <p className="mt-1 text-sm text-blue-50">
              {booked ? "Leader telah mengetuk palu. Selamat berlibur!" : "3 paket wisata disusun dari preferensi kolektif grup (BWM-TOPSIS)."}
            </p>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${isLeader ? "bg-[#FF5E1F] text-white" : "bg-white/20 text-white"}`}>
            {isLeader ? "👑 LEADER — berhak Ketuk Palu" : "👤 MEMBER"}
          </span>
        </div>
      </div>

      {err && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}
      {!booked && !isLeader && (
        <div className="mt-4 rounded-xl bg-[#FEF3C7] px-4 py-3 text-sm font-semibold text-[#92400E]">⏳ Menunggu Leader memilih paket final.</div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Paket */}
        <div className="space-y-4">
          {packages.map((p) => {
            const isFinal = finalId === p.id;
            const dim = booked && !isFinal;
            const info = TIER_INFO[p.variant] ?? TIER_INFO.STANDARD;
            const expanded = open === p.id;
            return (
              <div key={p.id} className={`overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition ${isFinal ? "border-[#FF5E1F]" : "border-slate-100"} ${dim ? "opacity-60" : ""}`}>
                <button onClick={() => setOpen(expanded ? null : p.id)} className="flex w-full items-center justify-between gap-3 p-5 text-left">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-extrabold ${info.warna}`}>{p.variant}</span>
                      {isFinal && <span className="rounded-full bg-[#FF5E1F] px-2.5 py-0.5 text-[10px] font-bold text-white">✅ TERPILIH</span>}
                    </div>
                    <div className="text-xs text-slate-500">{p.jenisArmada} • Hotel {p.hotel.tier} • {p.durasiHari} hari</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900">{formatRupiah(p.hargaPerOrang)}</div>
                    <div className="text-[10px] text-slate-400">/orang • {expanded ? "tutup ▲" : "lihat detail ▼"}</div>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 p-5">
                    {/* Termasuk */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {info.termasuk.map((t) => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">✓ {t}</span>)}
                    </div>

                    {/* Itinerary per hari */}
                    {p.days.map((d) => (
                      <div key={d.hari} className="mb-4">
                        <div className="mb-2 text-sm font-bold text-slate-800">📅 Hari {d.hari}</div>
                        <div className="space-y-2">
                          {d.stops.map((s) => (
                            <div key={s.urutanRute} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                              <div className="h-12 w-16 overflow-hidden rounded-lg">
                                <DestImage src={s.dest.imageUrl} alt={s.dest.nama} kategori={s.dest.kategori} className="h-full w-full" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-bold text-slate-800">{s.urutanRute}. {s.dest.nama}</div>
                                <div className="text-[11px] text-slate-500">🕐 {s.estimasiJam} • 📍 {s.dest.wilayah}{s.jarakDariSebelum != null ? ` • ${s.jarakDariSebelum} km` : ""}</div>
                              </div>
                              <div className="text-xs font-bold text-[#FF5E1F]">{formatRupiah(s.dest.hargaTiket)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Hotel */}
                    <div className="mb-4 rounded-xl border border-slate-100 p-3">
                      <div className="text-xs font-bold uppercase text-slate-400">🏨 Menginap</div>
                      <div className="mt-1 text-sm font-bold text-slate-800">{p.hotel.nama} <span className="text-xs font-normal text-slate-400">({p.hotel.tier})</span></div>
                      <div className="text-[11px] text-slate-500">⭐ {p.hotel.rating} • {p.hotel.wilayah} • {formatRupiah(p.hotel.hargaPerMalam)}/malam</div>
                    </div>

                    {/* Kuliner */}
                    {p.kuliner.length > 0 && (
                      <div className="rounded-xl border border-slate-100 p-3">
                        <div className="mb-2 text-xs font-bold uppercase text-slate-400">🍴 Kuliner Terdekat</div>
                        <div className="flex flex-wrap gap-2">
                          {p.kuliner.map((k) => (
                            <span key={k.nama} className="rounded-lg bg-[#FFF1EC] px-2.5 py-1 text-xs font-semibold text-[#FF5E1F]">{k.nama} • ⭐{k.rating}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aksi */}
                    {isLeader && !booked && (
                      <button onClick={() => ketukPalu(p)} disabled={busy}
                        className="orange-gradient mt-4 w-full rounded-xl py-3 font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">
                        {busy ? "Memproses..." : "🔨 Ketuk Palu — Pilih Paket Ini"}
                      </button>
                    )}
                    {!isLeader && (
                      <div className="mt-4 rounded-xl bg-slate-50 py-3 text-center text-xs font-semibold text-slate-400">Hanya Leader yang dapat memilih paket.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">🏆 Top 10 Destinasi (TOPSIS)</h3>
            <div className="space-y-2">
              {top10.map((t) => (
                <div key={t.ranking}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{t.ranking}. {t.nama}</span>
                    <span className="font-bold text-[#0194F3]">{(t.ciScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#0194F3]" style={{ width: `${(t.ciScore / maxCi) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">👥 Anggota ({members.length})</h3>
            <div className="space-y-1.5">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0194F3] text-[10px] font-bold text-white">{m.nama[0]?.toUpperCase()}</span>
                  {m.nama} {m.isLeader && <span className="text-[10px] text-[#FF5E1F]">👑</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
