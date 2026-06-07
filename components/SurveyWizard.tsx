// components/SurveyWizard.tsx
"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

interface Item { key: string; nama: string; emoji?: string }
interface Crit { key: string; nama: string; emoji: string; sub: { key: string; nama: string; emoji?: string }[] }
interface Picks { best: string | null; worst: string | null; b2o: Record<string, number>; o2w: Record<string, number> }

const SAATY: Record<number, string> = {
  1: "Sama penting", 2: "antara 1–3", 3: "Sedikit lebih penting", 4: "antara 3–5",
  5: "Lebih penting", 6: "antara 5–7", 7: "Sangat lebih penting", 8: "antara 7–9", 9: "Mutlak lebih penting",
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
      {/* gaya slider (thumb natural) */}
      <style>{`
        .jj-range{ -webkit-appearance:none; appearance:none; height:8px; border-radius:9999px; outline:none; cursor:pointer; }
        .jj-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:9999px; background:#0194F3; border:3px solid #fff; box-shadow:0 1px 5px rgba(2,119,194,.45); cursor:pointer; }
        .jj-range::-moz-range-thumb{ width:22px; height:22px; border-radius:9999px; background:#0194F3; border:3px solid #fff; box-shadow:0 1px 5px rgba(2,119,194,.45); cursor:pointer; }
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

      <div className="mb-2 text-sm font-bold text-red-500">▽ Paling Tidak Penting</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const isBest = picks.best === it.key;
          const on = picks.worst === it.key;
          return (
            <button key={it.key} disabled={isBest} onClick={() => onWorst(it.key)}
              className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${isBest ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300" : on ? "border-red-400 bg-red-50 text-red-500" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}>
              {it.emoji ? `${it.emoji} ` : ""}{it.nama}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====== Slider perbandingan (warna lembut, emoji dua sisi) ======
function Slider({ leftEmoji, leftName, rightEmoji, rightName, value, onChange }: {
  leftEmoji?: string; leftName: string; rightEmoji?: string; rightName: string; value: number; onChange: (v: number) => void;
}) {
  const pct = ((value - 1) / 8) * 100;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
        <span className="flex min-w-0 items-center gap-1"><span>{leftEmoji}</span><span className="truncate">{leftName}</span></span>
        <span className="shrink-0 rounded-full bg-[#E6F4FE] px-3 py-1 text-xs font-bold text-[#0277C2]">{value} • {SAATY[value]}</span>
        <span className="flex min-w-0 items-center justify-end gap-1"><span className="truncate text-right">{rightName}</span><span>{rightEmoji}</span></span>
      </div>
      <input type="range" min={1} max={9} step={1} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="jj-range w-full"
        style={{ background: `linear-gradient(to right, #0194F3 0%, #38BDF8 ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)` }} />
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

      <div className="mb-2 text-sm font-bold text-[#10B981]">A. {bestIt?.emoji} "{bestNama}" dibanding lainnya</div>
      <div className="mb-5 space-y-2">
        {items.filter((i) => i.key !== picks.best).map((it) => (
          <Slider key={"b" + it.key} leftEmoji={bestIt?.emoji} leftName={bestNama} rightEmoji={it.emoji} rightName={it.nama}
            value={picks.b2o[it.key] ?? DEF} onChange={(v) => onB2O(it.key, v)} />
        ))}
      </div>

      <div className="mb-2 text-sm font-bold text-red-500">B. Lainnya dibanding {worstIt?.emoji} "{worstNama}"</div>
      <div className="space-y-2">
        {items.filter((i) => i.key !== picks.worst).map((it) => (
          <Slider key={"w" + it.key} leftEmoji={it.emoji} leftName={it.nama} rightEmoji={worstIt?.emoji} rightName={worstNama}
            value={picks.o2w[it.key] ?? DEF} onChange={(v) => onO2W(it.key, v)} />
        ))}
      </div>
    </div>
  );
}
