// components/admin/ProductManager.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import MasterCrud, { type Field, type Column, type Filter } from "@/components/admin/MasterCrud";

interface Sub { key: string; nama: string }
interface Crit { key: string; nama: string; wajib: boolean; deskripsi: string | null; subKriteria: Sub[] }

const TABS_H = 53; // tinggi bar tab (untuk sticky offset header di bawahnya)
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

/* ===================== Tab Kriteria — CRUD penuh ===================== */
type EditTarget =
  | { kind: "crit-add" }
  | { kind: "crit-edit"; key: string; nama: string; deskripsi: string; wajib: boolean }
  | { kind: "sub-add"; critKey: string }
  | { kind: "sub-edit"; key: string; nama: string };

function KriteriaManager() {
  const [tree, setTree] = useState<Crit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [modal, setModal] = useState<EditTarget | null>(null);
  const [form, setForm] = useState<{ nama: string; deskripsi: string; wajib: boolean }>({ nama: "", deskripsi: "", wajib: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setLoadErr("");
    try {
      const r = await fetch("/api/admin/criteria", { cache: "no-store" });
      const d = await r.json();
      if (r.ok) setTree(d.criteria ?? []);
      else setLoadErr(d.error ?? "Gagal memuat kriteria");
    } catch { setLoadErr("Kesalahan jaringan / database. Pastikan migrasi sudah dijalankan."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function open(t: EditTarget) {
    setErr("");
    if (t.kind === "crit-edit") setForm({ nama: t.nama, deskripsi: t.deskripsi, wajib: t.wajib });
    else if (t.kind === "sub-edit") setForm({ nama: t.nama, deskripsi: "", wajib: false });
    else setForm({ nama: "", deskripsi: "", wajib: false });
    setModal(t);
  }

  async function submit() {
    if (!modal) return;
    if (form.nama.trim().length < 2) { setErr("Nama minimal 2 karakter"); return; }
    setBusy(true); setErr("");
    try {
      let url = "", method = "POST", body: any = {};
      if (modal.kind === "crit-add") { url = "/api/admin/criteria"; body = { nama: form.nama, deskripsi: form.deskripsi, wajib: form.wajib }; }
      else if (modal.kind === "crit-edit") { url = `/api/admin/criteria/${modal.key}`; method = "PATCH"; body = { nama: form.nama, deskripsi: form.deskripsi, wajib: form.wajib }; }
      else if (modal.kind === "sub-add") { url = `/api/admin/criteria/${modal.critKey}/sub`; body = { nama: form.nama }; }
      else if (modal.kind === "sub-edit") { url = `/api/admin/subcriteria/${modal.key}`; method = "PATCH"; body = { nama: form.nama }; }
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Gagal menyimpan"); return; }
      setModal(null); load();
    } catch { setErr("Kesalahan jaringan"); } finally { setBusy(false); }
  }

  async function del(kind: "crit" | "sub", key: string, label: string) {
    const warn = kind === "crit"
      ? `Hapus kriteria "${label}" beserta semua subkriteria & skornya? Tindakan ini tidak bisa dibatalkan.`
      : `Hapus subkriteria "${label}" beserta skornya?`;
    if (!confirm(warn)) return;
    const url = kind === "crit" ? `/api/admin/criteria/${key}` : `/api/admin/subcriteria/${key}`;
    try {
      const r = await fetch(url, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) { alert(d.error ?? "Gagal menghapus"); return; }
      load();
    } catch { alert("Kesalahan jaringan"); }
  }

  return (
    <div>
      <div className="sticky z-20 border-b border-slate-200/70 bg-[#F1F5F9] px-8 pb-3 pt-6" style={{ top: TABS_H }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">📋 Master Kriteria & Subkriteria</h1>
            <p className="text-sm text-slate-500">Tambah/edit/hapus kriteria & subkriteria. Perubahan langsung dipakai kuesioner BWM peserta.</p>
          </div>
          <button onClick={() => open({ kind: "crit-add" })} className="orange-gradient rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl">+ Kriteria</button>
        </div>
        <p className="mt-2 text-[11px] text-amber-600">⚠️ Kriteria bertanda WAJIB selalu aktif di semua grup. Min. 3 kriteria & tiap kriteria min. 2 subkriteria.</p>
      </div>

      <div className="px-8 pb-6 pt-4">
        {loading ? (
          <div className="py-10 text-center text-slate-400">Memuat...</div>
        ) : loadErr ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-semibold text-red-600">{loadErr}</p>
            <button onClick={load} className="mt-3 rounded-xl bg-[#0194F3] px-4 py-2 text-sm font-bold text-white hover:bg-[#0277C2]">Coba Muat Ulang</button>
          </div>
        ) : tree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-500">Belum ada kriteria tersimpan.</p>
            <p className="mt-1 text-xs text-slate-400">Jika ini pertama kali, pastikan migrasi DB sudah jalan lalu muat ulang — 8 kriteria + 40 subkriteria akan terisi otomatis.</p>
            <button onClick={load} className="mt-3 rounded-xl bg-[#0194F3] px-4 py-2 text-sm font-bold text-white hover:bg-[#0277C2]">Muat Ulang</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tree.map((c) => (
              <div key={c.key} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800"><span className="text-slate-400">{c.key}</span> · {c.nama}</h3>
                    {c.deskripsi && <p className="text-xs text-slate-500">{c.deskripsi}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {c.wajib
                      ? <span className="rounded-full bg-[#FFF1EC] px-2 py-0.5 text-[10px] font-bold text-[#FF5E1F]">WAJIB</span>
                      : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Opsional</span>}
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => open({ kind: "crit-edit", key: c.key, nama: c.nama, deskripsi: c.deskripsi ?? "", wajib: c.wajib })}
                    className="rounded-lg bg-[#E6F4FE] px-2.5 py-1 text-xs font-bold text-[#0277C2] hover:brightness-95">✏️ Edit</button>
                  <button onClick={() => del("crit", c.key, c.nama)} className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500 hover:bg-red-100">🗑️ Hapus</button>
                </div>

                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                  {c.subKriteria.map((s) => (
                    <li key={s.key} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600"><span className="text-[10px] text-slate-300">{s.key}</span> {s.nama}</span>
                      <span className="flex shrink-0 gap-1">
                        <button onClick={() => open({ kind: "sub-edit", key: s.key, nama: s.nama })} className="rounded px-1.5 py-0.5 text-xs text-[#0277C2] hover:bg-[#E6F4FE]">✏️</button>
                        <button onClick={() => del("sub", s.key, s.nama)} className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50">🗑️</button>
                      </span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => open({ kind: "sub-add", critKey: c.key })} className="mt-2 text-xs font-bold text-[#0194F3] hover:underline">+ Tambah subkriteria</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-extrabold text-slate-900">
              {modal.kind === "crit-add" ? "Tambah Kriteria" : modal.kind === "crit-edit" ? "Edit Kriteria" : modal.kind === "sub-add" ? "Tambah Subkriteria" : "Edit Subkriteria"}
            </h3>
            {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
            <label className="mb-1 block text-xs font-semibold text-slate-500">Nama</label>
            <input value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0194F3] focus:outline-none" />
            {(modal.kind === "crit-add" || modal.kind === "crit-edit") && (
              <>
                <label className="mb-1 mt-3 block text-xs font-semibold text-slate-500">Deskripsi (opsional)</label>
                <input value={form.deskripsi} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0194F3] focus:outline-none" />
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={form.wajib} onChange={(e) => setForm((f) => ({ ...f, wajib: e.target.checked }))} />
                  Jadikan kriteria wajib (selalu aktif di semua grup)
                </label>
                {modal.kind === "crit-add" && <p className="mt-2 text-[11px] text-slate-400">Kriteria baru otomatis dibekali 2 subkriteria awal yang bisa kamu rename.</p>}
              </>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Batal</button>
              <button onClick={submit} disabled={busy} className="rounded-xl bg-[#0194F3] px-5 py-2 text-sm font-bold text-white hover:bg-[#0277C2] disabled:opacity-50">{busy ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Tab Matriks Skor TOPSIS ===================== */
function ScoreMatrix() {
  const [tree, setTree] = useState<Crit[]>([]);
  const [dests, setDests] = useState<{ id: number; nama: string }[]>([]);
  const [selId, setSelId] = useState<number | "">("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/criteria", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/destinations", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([c, d]) => {
      setTree(c.criteria ?? []);
      setOpen(c.criteria?.[0]?.key ?? null);
      setDests((d.rows ?? []).map((x: any) => ({ id: x.id, nama: x.nama })));
    }).catch(() => {});
  }, []);

  async function loadScores(id: number) {
    setLoading(true); setMsg("");
    const init: Record<string, number> = {};
    tree.forEach((c) => c.subKriteria.forEach((s) => (init[s.key] = 3)));
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
    const payload = { destinationId: selId, scores: tree.flatMap((c) => c.subKriteria.map((s) => ({ kriteriaKey: c.key, subCriteriaKey: s.key, scoreValue: scores[s.key] ?? 3 }))) };
    try {
      const r = await fetch("/api/admin/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      setMsg(r.ok ? `✓ ${d.saved} nilai tersimpan` : d.error ?? "Gagal menyimpan");
    } catch { setMsg("Kesalahan jaringan"); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="sticky z-20 border-b border-slate-200/70 bg-[#F1F5F9] px-8 pb-3 pt-6" style={{ top: TABS_H }}>
        <h1 className="text-2xl font-extrabold text-slate-900">🎯 Matriks Skala TOPSIS</h1>
        <p className="text-sm text-slate-500">Pilih destinasi, atur nilai 1-5 tiap subkriteria. Skor ini dipakai mesin TOPSIS.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select value={selId} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setSelId(v); if (v) loadScores(v as number); }}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-[#0194F3] focus:outline-none">
            <option value="">— Pilih destinasi —</option>
            {dests.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
          </select>
          {selId !== "" && <button onClick={save} disabled={busy} className="rounded-xl bg-[#0194F3] px-5 py-2 text-sm font-bold text-white hover:bg-[#0277C2] disabled:opacity-50">{busy ? "Menyimpan..." : "💾 Simpan Skor"}</button>}
          {msg && <span className="text-sm font-semibold text-[#10B981]">{msg}</span>}
        </div>
      </div>

      <div className="px-8 pb-6 pt-4">
        {selId === "" ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">Pilih destinasi untuk mengatur skor.</div>
        ) : loading ? (
          <div className="text-center text-slate-400">Memuat skor...</div>
        ) : (
          <div className="space-y-2">
            {tree.map((c) => {
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
    </div>
  );
}

/* ===================== Wrapper Tabs ===================== */
export default function ProductManager() {
  const [tab, setTab] = useState<"destinasi" | "kriteria" | "skor">("destinasi");
  const TABS = [
    { key: "destinasi", label: "🗺️ Master Destinasi" },
    { key: "kriteria", label: "📋 Master Kriteria" },
    { key: "skor", label: "🎯 Matriks Skor" },
  ] as const;

  return (
    <div>
      <div className="sticky top-0 z-30 flex gap-1 border-b border-slate-200 bg-white px-8 pt-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-bold transition ${tab === t.key ? "border-b-2 border-[#0194F3] text-[#0194F3]" : "text-slate-400 hover:text-slate-600"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "destinasi" && (
        <MasterCrud title="Master Destinasi" icon="🗺️" endpoint="/api/admin/destinations" desc="Kelola 75 destinasi wisata (data inti TOPSIS)."
          columns={columns} fields={fields} filters={filters} searchKeys={["nama", "alamatLengkap"]} stickyTop={TABS_H} />
      )}
      {tab === "kriteria" && <KriteriaManager />}
      {tab === "skor" && <ScoreMatrix />}
    </div>
  );
}
