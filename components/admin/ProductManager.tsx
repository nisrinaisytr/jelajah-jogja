// components/admin/ProductManager.tsx
"use client";
import { useEffect, useState } from "react";
import MasterCrud, { type Field, type Column, type Filter } from "@/components/admin/MasterCrud";

interface Sub { key: string; nama: string }
interface Crit { key: string; nama: string; wajib: boolean; subKriteria: Sub[] }

const KATEGORI = ["Alam", "Budaya", "Edukasi", "Petualangan", "Relaksasi"];
const WILAYAH = ["Sleman", "Bantul", "Kota", "Gunungkidul", "Kulon Progo", "Magelang"];
const WAKTU = ["PAGI", "SIANG", "SORE", "MALAM", "FLEKSIBEL"];

const columns: Column[] = [
  { key: "nama", label: "Nama" },
  { key: "kategori", label: "Kategori", format: "badge" },
  { key: "wilayah", label: "Wilayah" },
  { key: "hargaTiket", label: "Tiket", format: "rupiah" },
  { key: "rating", label: "Rating", format: "rating" },
];
const fields: Field[] = [
  { name: "nama", label: "Nama Destinasi", type: "text", required: true, full: true },
  { name: "kategori", label: "Kategori", type: "select", options: KATEGORI, required: true },
  { name: "wilayah", label: "Wilayah", type: "select", options: WILAYAH, required: true },
  { name: "hargaTiket", label: "Harga Tiket (Rp)", type: "number", required: true },
  { name: "rating", label: "Rating (0-5)", type: "number", step: "0.1", required: true },
  { name: "waktuKunjunganIdeal", label: "Waktu Ideal", type: "select", options: WAKTU, required: true },
  { name: "durasiKunjungan", label: "Durasi Kunjungan (jam)", type: "number", step: "0.5", required: true },
  { name: "jarakPusat", label: "Jarak dari Malioboro (km)", type: "number", step: "0.1", required: true },
  { name: "latitude", label: "Latitude", type: "number", step: "any", required: true },
  { name: "longitude", label: "Longitude", type: "number", step: "any", required: true },
  { name: "jamBuka", label: "Jam Buka", type: "text", placeholder: "06:00", required: true },
  { name: "jamTutup", label: "Jam Tutup", type: "text", placeholder: "17:00", required: true },
  { name: "aksesBus", label: "Akses Bus", type: "checkbox" },
  { name: "bolehDrone", label: "Boleh Drone", type: "checkbox" },
  { name: "alamatLengkap", label: "Alamat Lengkap", type: "textarea", required: true },
  { name: "kulinerLokal", label: "Kuliner Lokal Sekitar", type: "text", full: true },
  { name: "deskripsi", label: "Deskripsi Singkat", type: "textarea" },
  { name: "deskripsiPanjang", label: "Deskripsi Panjang (halaman detail)", type: "textarea", required: true },
  { name: "tipsRombongan", label: "Tips Rombongan", type: "textarea", help: "Satu tips per baris" },
  { name: "fasilitas", label: "Fasilitas", type: "text", help: "Pisahkan dengan koma", full: true },
  { name: "imageUrl", label: "URL Gambar", type: "text", placeholder: "/images/destinations/nama.jpg", required: true, full: true },
];
const filters: Filter[] = [
  { name: "kategori", label: "Kategori", options: KATEGORI },
  { name: "wilayah", label: "Wilayah", options: WILAYAH },
];

/* ---------- Tab Kriteria (referensi) ---------- */
function KriteriaReference({ criteria }: { criteria: Crit[] }) {
  return (
    <div className="px-8 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">📋 Master Kriteria & Subkriteria</h1>
      <p className="text-sm text-slate-500">8 kriteria & 40 subkriteria penilaian (acuan kuesioner BWM). K2, K3, K8 wajib (terkunci).</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {criteria.map((c) => (
          <div key={c.key} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800"><span className="text-slate-400">{c.key}</span> · {c.nama}</h3>
              {c.wajib
                ? <span className="rounded-full bg-[#FFF1EC] px-2.5 py-0.5 text-[10px] font-bold text-[#FF5E1F]">🔒 WAJIB</span>
                : <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">Opsional</span>}
            </div>
            <ul className="mt-2 space-y-1">
              {c.subKriteria.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-sm text-slate-600"><span className="text-[10px] text-slate-300">{s.key}</span> {s.nama}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Tab Matriks Skor TOPSIS ---------- */
function ScoreMatrix({ criteria }: { criteria: Crit[] }) {
  const [dests, setDests] = useState<{ id: number; nama: string }[]>([]);
  const [selId, setSelId] = useState<number | "">("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<string | null>(criteria[0]?.key ?? null);

  useEffect(() => {
    fetch("/api/admin/destinations", { cache: "no-store" }).then((r) => r.json()).then((d) => setDests((d.rows ?? []).map((x: any) => ({ id: x.id, nama: x.nama })))).catch(() => {});
  }, []);

  async function loadScores(id: number) {
    setLoading(true); setMsg("");
    const init: Record<string, number> = {};
    criteria.forEach((c) => c.subKriteria.forEach((s) => (init[s.key] = 3)));
    try {
      const r = await fetch(`/api/admin/scores?destinationId=${id}`, { cache: "no-store" });
      const d = await r.json();
      if (r.ok) for (const s of d.scores ?? []) init[s.subCriteriaKey] = s.scoreValue;
    } catch {}
    setScores(init); setLoading(false);
  }

  async function save() {
    if (!selId) return;
    setBusy(true); setMsg("");
    const payload = { destinationId: selId, scores: criteria.flatMap((c) => c.subKriteria.map((s) => ({ kriteriaKey: c.key, subCriteriaKey: s.key, scoreValue: scores[s.key] ?? 3 }))) };
    try {
      const r = await fetch("/api/admin/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      setMsg(r.ok ? `✓ ${d.saved} nilai tersimpan` : d.error ?? "Gagal menyimpan");
    } catch { setMsg("Kesalahan jaringan"); }
    finally { setBusy(false); }
  }

  return (
    <div className="px-8 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">🎯 Matriks Skala TOPSIS</h1>
      <p className="text-sm text-slate-500">Pilih destinasi, lalu atur nilai 1-5 tiap subkriteria. Skor ini dipakai mesin TOPSIS.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <select value={selId} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setSelId(v); if (v) loadScores(v as number); }}
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0194F3] focus:outline-none">
          <option value="">— Pilih destinasi —</option>
          {dests.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
        </select>
        {selId !== "" && <button onClick={save} disabled={busy} className="rounded-xl bg-[#0194F3] px-5 py-2 text-sm font-bold text-white hover:bg-[#0277C2] disabled:opacity-50">{busy ? "Menyimpan..." : "💾 Simpan Semua Skor"}</button>}
        {msg && <span className="text-sm font-semibold text-[#10B981]">{msg}</span>}
      </div>

      {selId === "" ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">Pilih destinasi untuk mengatur skor.</div>
      ) : loading ? (
        <div className="mt-6 text-center text-slate-400">Memuat skor...</div>
      ) : (
        <div className="mt-5 space-y-2">
          {criteria.map((c) => {
            const ex = open === c.key;
            return (
              <div key={c.key} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <button onClick={() => setOpen(ex ? null : c.key)} className="flex w-full items-center justify-between px-5 py-3 text-left">
                  <span className="font-bold text-slate-800"><span className="text-slate-400">{c.key}</span> · {c.nama}</span>
                  <span className="text-slate-400">{ex ? "▲" : "▼"}</span>
                </button>
                {ex && (
                  <div className="border-t border-slate-100 p-4">
                    {c.subKriteria.map((s) => (
                      <div key={s.key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-slate-600">{s.nama}</span>
                        <select value={scores[s.key] ?? 3} onChange={(e) => setScores((m) => ({ ...m, [s.key]: Number(e.target.value) }))}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-sm focus:border-[#0194F3] focus:outline-none">
                          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Wrapper Tabs ---------- */
export default function ProductManager({ criteria }: { criteria: Crit[] }) {
  const [tab, setTab] = useState<"destinasi" | "kriteria" | "skor">("destinasi");
  const TABS = [
    { key: "destinasi", label: "🗺️ Master Destinasi" },
    { key: "kriteria", label: "📋 Master Kriteria" },
    { key: "skor", label: "🎯 Matriks Skor" },
  ] as const;

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 bg-white px-8 pt-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-bold transition ${tab === t.key ? "border-b-2 border-[#0194F3] text-[#0194F3]" : "text-slate-400 hover:text-slate-600"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "destinasi" && (
        <MasterCrud title="Master Destinasi" icon="🗺️" endpoint="/api/admin/destinations" desc="Kelola 75 destinasi wisata (data inti TOPSIS)."
          columns={columns} fields={fields} filters={filters} searchKeys={["nama", "alamatLengkap"]} />
      )}
      {tab === "kriteria" && <KriteriaReference criteria={criteria} />}
      {tab === "skor" && <ScoreMatrix criteria={criteria} />}
    </div>
  );
}
