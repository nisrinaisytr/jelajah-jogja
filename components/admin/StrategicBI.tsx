// components/admin/StrategicBI.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { formatRupiah } from "@/lib/destinasi-helpers";

interface Crit { key: string; nama: string }
interface SegRow { segment: string; weights: number[] }
interface BI {
  kpi: { totalWisatawan: number; totalGrup: number; bookedGrup: number; completedGrup: number; totalRevenue: number; conversionRate: number };
  age: { criteria: Crit[]; segments: SegRow[] };
  gender: { criteria: Crit[]; segments: SegRow[] };
  topKota: { kota: string; count: number }[];
  originMap: { points: { kota: string; lat: number; lng: number; count: number }[]; unknown: { kota: string; count: number }[] };
  trend: { label: string; created: number; booked: number }[];
  pkg: { nama: string; count: number; revenue: number }[];
  demo: { total: number; gender: { label: string; count: number }[]; ageBuckets: { label: string; count: number }[] };
  insight: string[];
}

const AGE_COLORS = ["#F59E0B", "#0194F3", "#10B981"];
const GENDER_COLORS: Record<string, string> = { "Laki-laki": "#0194F3", Perempuan: "#FF5E1F" };

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bi-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

/* ---- Radar (preferensi per segmen umur) ---- */
function Radar({ axes, series, colors }: { axes: Crit[]; series: SegRow[]; colors: string[] }) {
  const size = 300, cx = size / 2, cy = size / 2, R = 100, n = axes.length;
  if (n < 3) return <p className="text-sm text-slate-400">Butuh ≥3 kriteria untuk radar.</p>;
  const maxV = Math.max(0.0001, ...series.flatMap((s) => s.weights));
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / n);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ring = (f: number) => axes.map((_, i) => pt(i, R * f).join(",")).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[320px]">
        {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="#E2E8F0" strokeWidth="1" />)}
        {axes.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="1" />; })}
        {series.map((s, si) => {
          const poly = s.weights.map((w, i) => pt(i, (w / maxV) * R).join(",")).join(" ");
          return <polygon key={si} points={poly} fill={colors[si % colors.length]} fillOpacity={0.18} stroke={colors[si % colors.length]} strokeWidth="2" />;
        })}
        {axes.map((c, i) => { const [x, y] = pt(i, R + 14); return <text key={i} x={x} y={y} fontSize="10" fontWeight="700" fill="#64748B" textAnchor="middle" dominantBaseline="middle">{c.key}</text>; })}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {series.map((s, si) => <span key={si} className="flex items-center gap-1 text-xs font-semibold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[si % colors.length] }} />{s.segment}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
        {axes.map((c) => <span key={c.key}><b className="text-slate-500">{c.key}</b> {c.nama}</span>)}
      </div>
    </div>
  );
}

/* ---- Split bar gender per kriteria ---- */
function GenderBars({ criteria, segments }: { criteria: Crit[]; segments: SegRow[] }) {
  const maxV = Math.max(0.0001, ...segments.flatMap((s) => s.weights));
  return (
    <div className="space-y-2.5">
      {criteria.map((c, i) => (
        <div key={c.key}>
          <div className="mb-1 text-xs font-semibold text-slate-600">{c.nama}</div>
          <div className="space-y-1">
            {segments.map((s) => (
              <div key={s.segment} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-[10px] text-slate-400">{s.segment}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${((s.weights[i] ?? 0) / maxV) * 100}%`, background: GENDER_COLORS[s.segment] ?? "#94A3B8" }} />
                </div>
                <span className="w-10 shrink-0 text-right text-[10px] font-bold text-slate-500">{((s.weights[i] ?? 0) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- HBar list ---- */
function HBars({ rows, color }: { rows: { label: string; value: number; sub?: string }[]; color: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-slate-400">Belum ada data.</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="w-24 shrink-0 truncate text-xs font-semibold text-slate-600" title={r.label}>{r.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-md bg-slate-100">
            <div className="h-full rounded-md" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
          <span className="w-20 shrink-0 text-right text-[11px] font-bold text-slate-600">{r.sub ?? r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Tren konversi (SVG line) ---- */
function TrendChart({ trend }: { trend: BI["trend"] }) {
  const W = 520, H = 180, pad = 28;
  const max = Math.max(1, ...trend.flatMap((t) => [t.created, t.booked]));
  const n = trend.length;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, n - 1);
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad);
  const line = (key: "created" | "booked") => trend.map((t, i) => `${x(i)},${y(t[key])}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 0.5, 1].map((f) => <line key={f} x1={pad} y1={y(max * f)} x2={W - pad} y2={y(max * f)} stroke="#F1F5F9" />)}
        <polyline points={line("created")} fill="none" stroke="#0194F3" strokeWidth="2.5" />
        <polyline points={line("booked")} fill="none" stroke="#10B981" strokeWidth="2.5" />
        {trend.map((t, i) => <g key={i}><circle cx={x(i)} cy={y(t.created)} r="3" fill="#0194F3" /><circle cx={x(i)} cy={y(t.booked)} r="3" fill="#10B981" /><text x={x(i)} y={H - 8} fontSize="9" fill="#94A3B8" textAnchor="middle">{t.label}</text></g>)}
      </svg>
      <div className="mt-1 flex justify-center gap-4 text-xs font-semibold">
        <span className="flex items-center gap-1 text-[#0277C2]"><span className="h-2 w-2 rounded-full bg-[#0194F3]" />Grup dibuat</span>
        <span className="flex items-center gap-1 text-[#047857]"><span className="h-2 w-2 rounded-full bg-[#10B981]" />Grup dipesan</span>
      </div>
    </div>
  );
}

/* ---- Donut gender ---- */
function Donut({ data }: { data: { label: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="text-sm text-slate-400">Belum ada data.</p>;
  let acc = 0;
  const stops = data.map((d) => { const start = (acc / total) * 360; acc += d.count; const end = (acc / total) * 360; const col = GENDER_COLORS[d.label] ?? "#94A3B8"; return `${col} ${start}deg ${end}deg`; });
  return (
    <div className="flex items-center gap-5">
      <div className="h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(",")})` }}>
        <div className="flex h-full w-full items-center justify-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-sm font-extrabold text-slate-700">{total}</div></div>
      </div>
      <div className="space-y-1">
        {data.map((d) => <div key={d.label} className="flex items-center gap-2 text-sm text-slate-600"><span className="h-3 w-3 rounded-full" style={{ background: GENDER_COLORS[d.label] ?? "#94A3B8" }} />{d.label}: <b>{d.count}</b> ({Math.round((d.count / total) * 100)}%)</div>)}
      </div>
    </div>
  );
}

/* ---- Peta Leaflet ---- */
function OriginMap({ origin }: { origin: BI["originMap"] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inst = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function ensureLeaflet(): Promise<any> {
      if ((window as any).L) return (window as any).L;
      if (!document.getElementById("leaflet-css")) {
        const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet";
        l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(l);
      }
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        s.onload = () => res(); s.onerror = () => rej(new Error("leaflet gagal dimuat")); document.body.appendChild(s);
      });
      return (window as any).L;
    }
    ensureLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return;
      if (inst.current) { inst.current.remove(); inst.current = null; }
      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([-7.0, 110.0], 5);
      inst.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map);
      const maxC = Math.max(1, ...origin.points.map((p) => p.count));
      origin.points.forEach((p) => {
        L.circleMarker([p.lat, p.lng], { radius: 6 + (p.count / maxC) * 18, color: "#0194F3", fillColor: "#0194F3", fillOpacity: 0.5, weight: 2 })
          .addTo(map).bindPopup(`<b>${p.kota}</b><br>${p.count} wisatawan`);
      });
    }).catch(() => {});
    return () => { cancelled = true; if (inst.current) { inst.current.remove(); inst.current = null; } };
  }, [origin]);

  return (
    <div>
      <div ref={mapRef} className="h-80 w-full overflow-hidden rounded-xl border border-slate-100" style={{ background: "#Eaf2f8" }} />
      {origin.points.length === 0 && <p className="mt-2 text-sm text-slate-400">Belum ada wisatawan dengan kota dikenali.</p>}
      {origin.unknown.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-400">Kota tanpa koordinat: {origin.unknown.map((u) => `${u.kota} (${u.count})`).join(", ")}</p>
      )}
    </div>
  );
}

export default function StrategicBI() {
  const [d, setD] = useState<BI | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/admin/bi", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setD(j); else setErr(j.error ?? "Gagal memuat");
    } catch { setErr("Kesalahan jaringan"); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="px-8 pb-10">
      <style>{`
        .print-only { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body * { visibility: hidden !important; }
          #bi-report, #bi-report * { visibility: visible !important; }
          #bi-report { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .bi-grid { display: block !important; }
          .bi-grid > * { margin-bottom: 14px; }
          .bi-card { break-inside: avoid; box-shadow: none !important; }
        }
      `}</style>
      <div className="sticky top-0 z-20 -mx-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-[#F1F5F9] px-8 pb-3 pt-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">🧠 Strategic Business Intelligence</h1>
          <p className="text-sm text-slate-500">Analitik preferensi wisatawan & performa booking (berbasis bobot BWM). Khusus Owner.</p>
        </div>
        <div className="no-print flex gap-2">
          <a href="/api/admin/bi?format=csv" className="rounded-xl bg-[#10B981] px-4 py-2 text-sm font-bold text-white shadow hover:brightness-95">⬇️ Export CSV</a>
          <button onClick={() => window.print()} disabled={!d} className="rounded-xl bg-[#0194F3] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#0277C2] disabled:opacity-50">🖨️ Cetak / PDF</button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Memuat analitik...</div>
      ) : err ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-600">{err}</p>
          <button onClick={load} className="mt-3 rounded-xl bg-[#0194F3] px-4 py-2 text-sm font-bold text-white">Coba Lagi</button>
        </div>
      ) : d ? (
        <div id="bi-report">
          {/* Judul khusus saat dicetak/PDF */}
          <div className="print-only mb-4">
            <h2 className="text-xl font-extrabold text-slate-900">Laporan Strategic Business Intelligence — Jelajah Jogja</h2>
            <p className="text-xs text-slate-500">Dicetak: {new Date().toLocaleString("id-ID")}</p>
          </div>
          {/* KPI */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { l: "Total Wisatawan", v: d.kpi.totalWisatawan, a: "bg-[#E6F4FE]" },
              { l: "Total Grup", v: d.kpi.totalGrup, a: "bg-[#FFF1EC]" },
              { l: "Grup Dipesan", v: d.kpi.bookedGrup, a: "bg-[#ECFDF5]" },
              { l: "Konversi", v: `${d.kpi.conversionRate}%`, a: "bg-[#FEF3C7]" },
              { l: "Total Revenue", v: formatRupiah(d.kpi.totalRevenue), a: "bg-[#EDE9FE]", small: true },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-400">{k.l}</div>
                <div className={`mt-1 font-extrabold text-slate-900 ${k.small ? "text-lg" : "text-2xl"}`}>{k.v}</div>
              </div>
            ))}
          </div>

          <div className="bi-grid mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="🎯 Preferensi Kriteria per Segmen Umur (Radar)"><Radar axes={d.age.criteria} series={d.age.segments} colors={AGE_COLORS} /></Card>
            <Card title="⚖️ Preferensi Kriteria per Gender"><GenderBars criteria={d.gender.criteria} segments={d.gender.segments} /></Card>
            <Card title="🏙️ Top Kota Asal Wisatawan"><HBars rows={d.topKota.map((k) => ({ label: k.kota, value: k.count }))} color="#0194F3" /></Card>
            <Card title="📈 Tren Grup & Booking (6 bulan)"><TrendChart trend={d.trend} /></Card>
            <Card title="🗺️ Peta Sebaran Asal Wisatawan"><OriginMap origin={d.originMap} /></Card>
            <Card title="🎟️ Paket Terpilih & Revenue">
              <HBars rows={d.pkg.map((p) => ({ label: p.nama, value: p.revenue, sub: `${p.count} grup` }))} color="#10B981" />
              {d.pkg.length > 0 && <div className="mt-2 text-right text-xs text-slate-400">Nilai bar = total revenue paket</div>}
            </Card>
            <Card title="👥 Demografi: Gender"><Donut data={d.demo.gender} /></Card>
            <Card title="📊 Demografi: Sebaran Umur"><HBars rows={d.demo.ageBuckets.map((b) => ({ label: b.label, value: b.count }))} color="#FF5E1F" /></Card>
          </div>

          {/* AI Insight */}
          <div className="mt-6 rounded-2xl border border-[#0194F3]/20 bg-gradient-to-br from-[#E6F4FE] to-white p-5 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0277C2]">✨ Ringkasan Insight Otomatis</h3>
            <ul className="space-y-1.5">
              {d.insight.map((t, i) => <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-[#0194F3]">•</span>{t}</li>)}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
