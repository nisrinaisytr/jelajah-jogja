// components/admin/InsightsView.tsx
"use client";

interface Pop { id: number; nama: string; kategori: string; count: number }
interface Kat { kategori: string; count: number }
interface Low { id: number; nama: string; kategori: string; wilayah: string; count: number }
interface Dur { durasi: number; label: string; count: number; pct: number }

const KAT_COLOR: Record<string, string> = {
  Alam: "#10B981", Budaya: "#FF5E1F", Edukasi: "#0194F3", Petualangan: "#8B5CF6", Relaksasi: "#14B8A6",
};
const colorOf = (k: string) => KAT_COLOR[k] ?? "#94A3B8";

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">{text}</div>;
}

export default function InsightsView({ popular, kategori, low, durasi }: { popular: Pop[]; kategori: Kat[]; low: Low[]; durasi: Dur[] }) {
  const maxPop = Math.max(...popular.map((p) => p.count), 1);
  const totalKat = kategori.reduce((s, k) => s + k.count, 0) || 1;

  // Donut via conic-gradient
  let acc = 0;
  const stops = kategori.map((k) => {
    const from = (acc / totalKat) * 100;
    acc += k.count;
    const to = (acc / totalKat) * 100;
    return `${colorOf(k.kategori)} ${from}% ${to}%`;
  });
  const donutBg = stops.length ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(#E2E8F0 0% 100%)";

  return (
    <div className="px-8 pb-6">
      <div className="sticky top-0 z-20 -mx-8 border-b border-slate-200/70 bg-[#F1F5F9] px-8 pb-3 pt-6">
        <h1 className="text-2xl font-extrabold text-slate-900">💡 Operational Insights</h1>
        <p className="text-sm text-slate-500">Pola minat wisata dari hasil agregasi semua grup.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top 10 destinasi */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-400">🏆 Top 10 Destinasi Paling Diminati</h3>
          {popular.length === 0 ? <Empty text="Belum ada data peringkat." /> : (
            <div className="space-y-2.5">
              {popular.map((p, i) => (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{i + 1}. {p.nama}</span>
                    <span className="font-bold text-slate-500">{p.count}×</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(p.count / maxPop) * 100}%`, background: colorOf(p.kategori) }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donut kategori */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-400">🍩 Tren Tipe Wisata Dominan</h3>
          {kategori.length === 0 ? <Empty text="Belum ada data." /> : (
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: donutBg }}>
                <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-xl font-extrabold text-slate-800">{totalKat}</span>
                  <span className="text-[10px] text-slate-400">top-3 picks</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {kategori.map((k) => (
                  <div key={k.kategori} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-sm" style={{ background: colorOf(k.kategori) }} />
                    <span className="font-semibold text-slate-700">{k.kategori}</span>
                    <span className="text-slate-400">{Math.round((k.count / totalKat) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabel performa rendah */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-400">📉 Destinasi Performa Rendah</h3>
          {low.length === 0 ? <Empty text="Belum ada data peringkat bawah." /> : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <tr><th className="px-3 py-2">Destinasi</th><th className="px-3 py-2">Wilayah</th><th className="px-3 py-2 text-right">≥ Rank 50</th></tr>
                </thead>
                <tbody>
                  {low.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-slate-700">{d.nama}</td>
                      <td className="px-3 py-2 text-slate-500">{d.wilayah}</td>
                      <td className="px-3 py-2 text-right font-bold text-[#F59E0B]">{d.count}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-400">Kandidat untuk audit nilai (Menu Kelola Wisata).</p>
        </div>

        {/* Distribusi durasi */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-slate-400">📅 Distribusi Durasi Tour</h3>
          {durasi.length === 0 ? <Empty text="Belum ada grup." /> : (
            <div className="space-y-3">
              {durasi.map((d) => (
                <div key={d.durasi}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{d.label}</span>
                    <span className="font-bold text-slate-500">{d.count} grup • {d.pct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#0194F3]" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
