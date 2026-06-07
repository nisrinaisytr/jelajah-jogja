// components/SurveyWizard.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

interface Item { key: string; nama: string; emoji?: string }
interface Crit { key: string; nama: string; emoji: string; sub: { key: string; nama: string }[] }
interface Picks { best: string | null; worst: string | null; b2o: Record<string, number>; o2w: Record<string, number> }

// Label singkat untuk tooltip mengambang
const SAATY_SHORT: Record<number, string> = {
  1: "Sama penting", 2: "Sama–sedikit", 3: "Sedikit lebih", 4: "Sedikit–lebih",
  5: "Lebih penting", 6: "Lebih–sangat", 7: "Sangat lebih", 8: "Sangat–mutlak", 9: "Mutlak lebih",
};
const DEF = 3;
function emptyPicks(): Picks { return { best: null, worst: null, b2o: {}, o2w: {} }; }

export default function SurveyWizard({ groupCode, groupName, criteria }: { groupCode: string; groupName: string; criteria: Crit[] }) {
  const [idx, setIdx] = useState(0);
  const [crit, setCrit] = useState<Picks>(emptyPicks());
  const [subs, setSubs] = useState<Record<string, Picks>>(() => Object.fromEntries(criteria.map((c) => [c.key, emptyPicks()])));
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const steps = useMemo(() => {
    const s: { kind: string; ci?: number }[] = [{ kind: "crit-pick" }, { kind: "crit-vote" }];
    criteria.forEach((_, i) => { s.push({ kind: "sub-pick", ci: i }); s.push({ kind: "sub-vote", ci: i }); });
    return s;
  }, [criteria]);
  const total = steps.length;
  const step = steps[idx];
  const isLast = idx === total - 1;

  // --- Simpan & pulihkan progres pengisian (auto-save di browser) ---
  const LS_KEY = `jj-survey-${groupCode}`;
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null;
      if (raw) {
        const s = JSON.parse(raw);
        if (s.crit) setCrit(s.crit);
        if (s.subs) setSubs((prev) => ({ ...prev, ...s.subs }));
        if (typeof s.idx === "number") setIdx(Math.max(0, Math.min(s.idx, total - 1)));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LS_KEY]);
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(LS_KEY, JSON.stringify({ idx, crit, subs }));
    } catch {}
  }, [LS_KEY, idx, crit, subs]);

  function setCritField(p: Partial<Picks>) { setCrit((c) => ({ ...c, ...p })); }
  function setSubField(ck: string, p: Partial<Picks>) { setSubs((s) => ({ ...s, [ck]: { ...s[ck], ...p } })); }

  function pickValid(p: Picks) { return !!p.best && !!p.worst && p.best !== p.worst; }
  const canNext = (() => {
    if (step.kind === "crit-pick") return pickValid(crit);
    if (step.kind === "sub-pick") return pickValid(subs[criteria[step.ci!].key]);
    return true;
  })();

  async function submit() {
    setErr(""); setSubmitting(true);
    try {
      const fill = (items: Item[], p: Picks): Picks => {
        const b2o: Record<string, number> = {}, o2w: Record<string, number> = {};
        for (const it of items) {
          if (it.key !== p.best) b2o[it.key] = p.b2o[it.key] ?? DEF;
          if (it.key !== p.worst) o2w[it.key] = p.o2w[it.key] ?? DEF;
        }
        return { best: p.best, worst: p.worst, b2o, o2w };
      };
      const payload = {
        groupCode,
        criteria: fill(criteria, crit),
        subs: Object.fromEntries(criteria.map((c) => [c.key, fill(c.sub, subs[c.key])])),
      };
      const res = await fetch("/api/survey/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Gagal menyimpan jawaban"); return; }
      try { window.localStorage.removeItem(LS_KEY); } catch {}
      setDone(true);
    } catch { setErr("Kesalahan jaringan"); }
    finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Kuesioner Terkirim!</h1>
          <p className="mt-1 text-sm text-slate-500">Terima kasih. Tunggu anggota lain — hasil dihitung otomatis saat semua selesai.</p>
          <Link href={`/waiting-room/${groupCode}`} className="orange-gradient mt-5 block rounded-xl py-3 font-bold text-white shadow-lg transition hover:shadow-xl">Ke Waiting Room →</Link>
          <Link href="/home" className="mt-3 inline-block text-sm font-semibold text-slate-500 hover:underline">Kembali ke Beranda</Link>
        </div>
      </main>
    );
  }

  let levelLabel = "Level Kriteria";
  if (step.kind.startsWith("sub")) levelLabel = `Subkriteria — ${criteria[step.ci!].nama}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-6">
      <style>{`
        .jj-range{ -webkit-appearance:none; appearance:none; height:8px; border-radius:9999px; outline:none; cursor:pointer; }
        .jj-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:24px; height:24px; border-radius:9999px; background:#fff; border:4px solid #0194F3; box-shadow:0 1px 6px rgba(2,119,194,.4); cursor:pointer; margin-top:-8px; }
        .jj-range::-moz-range-thumb{ width:24px; height:24px; border-radius:9999px; background:#fff; border:4px solid #0194F3; box-shadow:0 1px 6px rgba(2,119,194,.4); cursor:pointer; }
      `}</style>

      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-500">{groupName} • {groupCode}</span>
        <span className="font-semibold text-slate-500">Sesi {idx + 1}/{total}</span>
      </div>
      <div className="mb-1 text-lg font-extrabold text-slate-900">📊 {levelLabel}</div>
      <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#0194F3] transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {err && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {step.kind === "crit-pick" && (
          <PickStep title="Pilih Kriteria Paling & Paling Tidak Penting" subtitle="Menurutmu, untuk memilih wisata grup ini:"
            items={criteria.map((c) => ({ key: c.key, nama: c.nama, emoji: c.emoji }))} picks={crit}
            onBest={(k) => setCritField({ best: k, worst: crit.worst === k ? null : crit.worst })} onWorst={(k) => setCritField({ worst: k })} />
        )}
        {step.kind === "crit-vote" && (
          <VoteStep items={criteria.map((c) => ({ key: c.key, nama: c.nama, emoji: c.emoji }))} picks={crit}
            onB2O={(k, v) => setCritField({ b2o: { ...crit.b2o, [k]: v } })} onO2W={(k, v) => setCritField({ o2w: { ...crit.o2w, [k]: v } })} />
        )}
        {step.kind === "sub-pick" && (() => {
          const c = criteria[step.ci!];
          return (
            <PickStep title={`Subkriteria dari "${c.nama}"`} subtitle="Pilih aspek paling & paling tidak penting:"
              items={c.sub} picks={subs[c.key]}
              onBest={(k) => setSubField(c.key, { best: k, worst: subs[c.key].worst === k ? null : subs[c.key].worst })}
              onWorst={(k) => setSubField(c.key, { worst: k })} />
          );
        })()}
        {step.kind === "sub-vote" && (() => {
          const c = criteria[step.ci!];
          return (
            <VoteStep items={c.sub} picks={subs[c.key]}
              onB2O={(k, v) => setSubField(c.key, { b2o: { ...subs[c.key].b2o, [k]: v } })}
              onO2W={(k, v) => setSubField(c.key, { o2w: { ...subs[c.key].o2w, [k]: v } })} />
          );
        })()}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
          className="rounded-xl border-2 border-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">← Kembali</button>
        {isLast ? (
          <button onClick={submit} disabled={!canNext || submitting}
            className="orange-gradient rounded-xl px-6 py-2.5 font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">{submitting ? "Menyimpan..." : "✅ Submit Kuesioner"}</button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} disabled={!canNext}
            className="rounded-xl bg-[#0194F3] px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0277C2] disabled:cursor-not-allowed disabled:opacity-50">Lanjut →</button>
        )}
      </div>
    </main>
  );
}

// ====== Pilih Best & Worst ======
function PickStep({ title, subtitle, items, picks, onBest, onWorst }: {
  title: string; subtitle: string; items: Item[]; picks: Picks; onBest: (k: string) => void; onWorst: (k: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <p className="mb-4 text-sm text-slate-500">{subtitle}</p>

      <div className="mb-2 text-sm font-bold text-[#10B981]">⭐ Paling Penting</div>
      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const on = picks.best === it.key;
          return (
            <button key={it.key} onClick={() => onBest(it.key)}
              className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${on ? "border-[#10B981] bg-[#ECFDF5] text-[#10B981]" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}>
              {it.emoji ? `${it.emoji} ` : ""}{it.nama}
            </button>
          );
        })}
      </div>

      <div className="mb-2 text-sm font-bold text-rose-500">▽ Paling Tidak Penting</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const isBest = picks.best === it.key;
          const on = picks.worst === it.key;
          return (
            <button key={it.key} disabled={isBest} onClick={() => onWorst(it.key)}
              className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${isBest ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300" : on ? "border-rose-400 bg-rose-50 text-rose-500" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}>
              {it.emoji ? `${it.emoji} ` : ""}{it.nama}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====== Slider perbandingan (label kiri, angka kanan, tooltip mengambang) ======
function Slider({ emoji, label, anchorName, anchorSide, value, onChange }: { emoji?: string; label: string; anchorName: string; anchorSide: "left" | "right"; value: number; onChange: (v: number) => void }) {
  const pct = ((value - 1) / 8) * 100;
  const tipLeft = 6 + pct * 0.88; // jaga agar tidak terpotong di tepi
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-x-1.5 font-semibold text-slate-800">
          {anchorSide === "left" && <span className="font-normal text-slate-400">{anchorName} vs</span>}
          {emoji && <span>{emoji}</span>}<span>{label}</span>
          {anchorSide === "right" && <span className="font-normal text-slate-400">vs {anchorName}</span>}
        </span>
        <span className="shrink-0 text-xl font-extrabold text-[#0194F3]">{value}</span>
      </div>
      <div className="relative mt-6">
        <div className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2" style={{ left: `${tipLeft}%` }}>
          <span className="relative inline-block whitespace-nowrap rounded-lg bg-[#1E293B] px-2.5 py-1 text-xs font-semibold text-white shadow-md">
            {SAATY_SHORT[value]}
            <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-[#1E293B]" />
          </span>
        </div>
        <input type="range" min={1} max={9} step={1} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="jj-range w-full"
          style={{ background: `linear-gradient(to right, #0277C2 0%, #38BDF8 ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)` }} />
      </div>
    </div>
  );
}

function VoteStep({ items, picks, onB2O, onO2W }: {
  items: Item[]; picks: Picks; onB2O: (k: string, v: number) => void; onO2W: (k: string, v: number) => void;
}) {
  const bestIt = items.find((i) => i.key === picks.best);
  const worstIt = items.find((i) => i.key === picks.worst);
  const bestNama = bestIt?.nama ?? "Terpenting";
  const worstNama = worstIt?.nama ?? "Terendah";
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800">Seberapa Penting Perbandingannya?</h2>
      <p className="mb-4 text-sm text-slate-500">Geser slider 1–9 (1 = sama penting, 9 = jauh lebih penting).</p>

      {/* A — Best vs lainnya (kotak hijau) */}
      <div className="rounded-2xl border border-[#10B981]/30 bg-gradient-to-b from-[#ECFDF5] to-white p-4">
        <div className="mb-1 text-sm font-bold text-[#10B981]">A · Bandingkan {bestIt?.emoji} “{bestNama}” dengan kriteria lain</div>
        {items.filter((i) => i.key !== picks.best).map((it) => (
          <Slider key={"b" + it.key} emoji={it.emoji} label={it.nama} anchorName={bestNama} anchorSide="left" value={picks.b2o[it.key] ?? DEF} onChange={(v) => onB2O(it.key, v)} />
        ))}
      </div>

      {/* jeda */}
      <div className="h-5" />

      {/* B — lainnya vs Worst (kotak merah) */}
      <div className="rounded-2xl border border-rose-300/40 bg-gradient-to-b from-[#FFF1F2] to-white p-4">
        <div className="mb-1 text-sm font-bold text-rose-500">B · Bandingkan kriteria lain dengan {worstIt?.emoji} “{worstNama}”</div>
        {items.filter((i) => i.key !== picks.worst).map((it) => (
          <Slider key={"w" + it.key} emoji={it.emoji} label={it.nama} anchorName={worstNama} anchorSide="right" value={picks.o2w[it.key] ?? DEF} onChange={(v) => onO2W(it.key, v)} />
        ))}
      </div>
    </div>
  );
}
