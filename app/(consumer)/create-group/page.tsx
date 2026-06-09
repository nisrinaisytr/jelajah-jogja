// app/(consumer)/create-group/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const DURASI = [
  { val: 1, label: "1 Hari", sub: "One Day Trip", emoji: "☀️" },
  { val: 2, label: "2D1N", sub: "2 Hari 1 Malam", emoji: "🌙" },
  { val: 3, label: "3D2N", sub: "3 Hari 2 Malam", emoji: "🏕️" },
];

// Emoji ramah-konsumen per kriteria bawaan; kriteria baru pakai default.
const CRIT_EMOJI: Record<string, string> = { K1: "🌲", K2: "💰", K3: "🚗", K4: "🚻", K5: "📸", K6: "🛡️", K7: "🌿", K8: "👥" };
const emojiOf = (k: string) => CRIT_EMOJI[k] ?? "🎯";

interface Sub { key: string; nama: string }
interface Crit { key: string; nama: string; wajib: boolean; deskripsi: string | null; subKriteria: Sub[] }

function Toggle({ on, color }: { on: boolean; color: string }) {
  return (
    <span className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition ${on ? color : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </span>
  );
}

export default function CreateGroupPage() {
  const [tree, setTree] = useState<Crit[]>([]);
  const [minOpsional, setMinOpsional] = useState(2);
  const [loadingTree, setLoadingTree] = useState(true);

  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [quota, setQuota] = useState("4");
  const [durasi, setDurasi] = useState<number | null>(null);
  const [opsional, setOpsional] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/criteria", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setTree(d.criteria ?? []); if (d.minOpsional) setMinOpsional(d.minOpsional); })
      .catch(() => {})
      .finally(() => setLoadingTree(false));
  }, []);

  const WAJIB = useMemo(() => tree.filter((c) => c.wajib), [tree]);
  const OPSIONAL = useMemo(() => tree.filter((c) => !c.wajib), [tree]);

  const quotaNum = parseInt(quota || "0", 10);
  const step1Valid = groupName.trim().length > 0 && quotaNum >= 2;
  const step2Valid = durasi !== null;
  const canGenerate = opsional.length >= minOpsional;
  const totalDipilih = WAJIB.length + opsional.length;

  const activeCriteria = useMemo(
    () => tree.filter((c) => c.wajib || opsional.includes(c.key)).map((c) => c.key),
    [tree, opsional]
  );

  function toggleOpsional(key: string) {
    setOpsional((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  }

  async function generate() {
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: groupName.trim(), totalQuota: quotaNum, durasiTour: durasi, activeCriteria }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Gagal membuat grup"); return; }
      setCode(data.groupCode);
    } catch { setErr("Kesalahan jaringan"); }
    finally { setLoading(false); }
  }

  async function copyCode() {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ===== Layar sukses =====
  if (code) {
    return (
      <main className="mx-auto max-w-lg px-6 py-12 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Grup Berhasil Dibuat!</h1>
          <p className="mt-1 text-sm text-slate-500">Bagikan kode ini ke anggota rombongan untuk bergabung.</p>
          <div className="my-6 rounded-2xl border-2 border-dashed border-[#0194F3] bg-[#E6F4FE] py-6">
            <div className="text-xs font-bold uppercase text-[#0277C2]">Kode Grup</div>
            <div className="mt-1 font-mono text-4xl font-extrabold tracking-widest text-[#0194F3]">{code}</div>
          </div>
          <button onClick={copyCode}
            className={`mb-3 w-full rounded-xl border-2 py-2.5 font-semibold transition ${copied ? "border-[#10B981] bg-[#ECFDF5] text-[#10B981]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
            {copied ? "✓ Kode tersalin!" : "📋 Salin Kode"}
          </button>
          <Link href={`/survey/${code}`} className="orange-gradient block rounded-xl py-3 font-bold text-white shadow-lg transition hover:shadow-xl">
            Lanjut Isi Kuesioner →
          </Link>
          <Link href="/home" className="mt-3 inline-block text-sm font-semibold text-slate-500 hover:underline">Kembali ke Beranda</Link>
        </div>
      </main>
    );
  }

  // ===== Wizard =====
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/home" className="text-sm font-semibold text-slate-500 hover:underline">← Batal</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Buat Grup Baru</h1>

      <div className="my-6 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? "bg-[#0194F3] text-white" : "bg-slate-200 text-slate-500"}`}>{s}</span>
            {s < 3 && <span className={`h-1 flex-1 rounded ${step > s ? "bg-[#0194F3]" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {err && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

      {step === 1 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">1. Info Grup</h2>
            <div>
              <label className="text-sm font-medium text-slate-700">Nama Grup</label>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="cth: Liburan Kantor 2026"
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Kuota Anggota (min 2)</label>
              <input type="number" min={2} value={quota} onChange={(e) => setQuota(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/20" />
              {quota !== "" && quotaNum < 2 && <p className="mt-1 text-xs font-semibold text-red-500">Kuota minimal 2 orang.</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setStep(2)} disabled={!step1Valid}
              className="rounded-xl bg-[#0194F3] px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0277C2] disabled:cursor-not-allowed disabled:opacity-50">Lanjut →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">2. Durasi Tour</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {DURASI.map((d) => {
              const active = durasi === d.val;
              return (
                <button key={d.val} onClick={() => setDurasi(d.val)}
                  className={`rounded-2xl border-2 p-4 text-center transition ${active ? "border-[#FF5E1F] bg-[#FFF1EC]" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="text-3xl">{d.emoji}</div>
                  <div className={`mt-2 font-extrabold ${active ? "text-[#FF5E1F]" : "text-slate-800"}`}>{d.label}</div>
                  <div className="text-[11px] text-slate-500">{d.sub}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="rounded-xl border-2 border-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50">← Kembali</button>
            <button onClick={() => setStep(3)} disabled={!step2Valid}
              className="rounded-xl bg-[#0194F3] px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0277C2] disabled:cursor-not-allowed disabled:opacity-50">Lanjut →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-slate-900">Pilih Kriteria untuk Grup Anda</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih minimal {minOpsional} kriteria opsional. {WAJIB.length} kriteria wajib otomatis aktif. Total tersedia: {tree.length} kriteria.</p>
            </div>

            {loadingTree ? (
              <div className="py-10 text-center text-slate-400">Memuat kriteria...</div>
            ) : (
              <>
                {/* WAJIB */}
                <div className="mt-6 flex items-center gap-3">
                  <span className="rounded-full bg-[#FFF1EC] px-3 py-1 text-xs font-bold text-[#FF5E1F]">🔒 WAJIB AKTIF</span>
                  <span className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {WAJIB.map((c) => (
                    <div key={c.key} className="rounded-2xl border-2 border-[#FF5E1F]/40 bg-[#FFF1EC] p-4">
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{emojiOf(c.key)}</span>
                        <Toggle on color="bg-[#FF5E1F]" />
                      </div>
                      <div className="mt-3 font-bold text-slate-800">{c.nama}</div>
                      {c.deskripsi && <div className="text-xs text-slate-500">{c.deskripsi}</div>}
                    </div>
                  ))}
                </div>

                {/* OPSIONAL */}
                <div className="mt-7 flex items-center gap-3">
                  <span className="rounded-full bg-[#E6F4FE] px-3 py-1 text-xs font-bold text-[#0277C2]">⚙️ OPSIONAL (pilih min {minOpsional})</span>
                  <span className="h-px flex-1 bg-slate-100" />
                  <span className={`text-xs font-bold ${canGenerate ? "text-[#10B981]" : "text-[#F59E0B]"}`}>{opsional.length} dari {OPSIONAL.length} dipilih</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {OPSIONAL.map((c) => {
                    const on = opsional.includes(c.key);
                    return (
                      <button key={c.key} onClick={() => toggleOpsional(c.key)}
                        className={`rounded-2xl border-2 p-4 text-left transition ${on ? "border-[#0194F3] bg-[#E6F4FE]" : "border-slate-200 hover:border-slate-300"}`}>
                        <div className="flex items-start justify-between">
                          <span className="text-3xl">{emojiOf(c.key)}</span>
                          <Toggle on={on} color="bg-[#0194F3]" />
                        </div>
                        <div className="mt-3 font-bold text-slate-800">{c.nama}</div>
                        {c.deskripsi && <div className="text-xs text-slate-500">{c.deskripsi}</div>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Summary bar */}
          <div className={`mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border p-5 sm:flex-row ${canGenerate ? "border-[#10B981]/30 bg-[#ECFDF5]" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold text-white ${canGenerate ? "bg-[#10B981]" : "bg-slate-400"}`}>{totalDipilih}</span>
              <div>
                <div className="font-bold text-slate-800">{totalDipilih} dari {tree.length} kriteria dipilih</div>
                <div className="text-xs text-slate-500">{WAJIB.length} wajib + {opsional.length} opsional</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="rounded-xl border-2 border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-white">← Kembali</button>
              <button onClick={generate} disabled={!canGenerate || loading}
                className="orange-gradient rounded-xl px-6 py-3 font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Membuat..." : "Buat Grup & Lanjut →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
