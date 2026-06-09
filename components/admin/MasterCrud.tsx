// components/admin/MasterCrud.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah } from "@/lib/destinasi-helpers";

export type Field = { name: string; label: string; type: "text" | "number" | "select" | "textarea" | "checkbox"; options?: string[]; required?: boolean; step?: string; placeholder?: string; help?: string; full?: boolean };
export type Column = { key: string; label: string; format?: "rupiah" | "text" | "rating" | "badge" };
export type Filter = { name: string; label: string; options: string[] };

type Row = Record<string, any>;

export default function MasterCrud({ title, icon, endpoint, columns, fields, filters = [], searchKeys, desc, stickyTop = 0 }: {
  title: string; icon: string; endpoint: string; columns: Column[]; fields: Field[]; filters?: Filter[]; searchKeys: string[]; desc?: string; stickyTop?: number;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterVal, setFilterVal] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; data: Row }>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch(endpoint, { cache: "no-store" });
      const d = await r.json();
      if (r.ok) setRows(d.rows ?? []);
    } catch {} finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((row) => {
    const matchQ = !q || searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q.toLowerCase()));
    const matchF = filters.every((f) => !filterVal[f.name] || String(row[f.name]) === filterVal[f.name]);
    return matchQ && matchF;
  });

  function openAdd() {
    const blank: Row = {};
    for (const f of fields) blank[f.name] = f.type === "checkbox" ? false : f.type === "select" ? (f.options?.[0] ?? "") : "";
    setErr(""); setModal({ mode: "add", data: blank });
  }
  function openEdit(row: Row) { setErr(""); setModal({ mode: "edit", data: { ...row } }); }

  async function save() {
    if (!modal) return;
    for (const f of fields) {
      if (f.required && (modal.data[f.name] === "" || modal.data[f.name] === null || modal.data[f.name] === undefined)) {
        setErr(`"${f.label}" wajib diisi`); return;
      }
    }
    setBusy(true); setErr("");
    try {
      const isEdit = modal.mode === "edit";
      const url = isEdit ? `${endpoint}/${modal.data.id}` : endpoint;
      const r = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(modal.data) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "Gagal menyimpan"); return; }
      setModal(null); load();
    } catch { setErr("Kesalahan jaringan"); } finally { setBusy(false); }
  }

  async function remove(row: Row) {
    if (!confirm(`Hapus "${row.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const r = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) { alert(d.error ?? "Gagal menghapus"); return; }
      load();
    } catch { alert("Kesalahan jaringan"); }
  }

  function fmt(row: Row, col: Column) {
    const v = row[col.key];
    if (col.format === "rupiah") return formatRupiah(Number(v));
    if (col.format === "rating") return `⭐ ${v}`;
    if (col.format === "badge") return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{v}</span>;
    return String(v ?? "-");
  }

  return (
    <div>
      {/* Header sticky: judul + toolbar tetap terlihat saat daftar discroll */}
      <div className="sticky z-20 border-b border-slate-200/70 bg-[#F1F5F9] px-8 pb-3 pt-6" style={{ top: stickyTop }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{icon} {title}</h1>
            {desc && <p className="text-sm text-slate-500">{desc}</p>}
          </div>
          <button onClick={openAdd} className="orange-gradient rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl">+ Tambah</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Cari nama..."
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-[#0194F3] focus:outline-none" />
          {filters.map((f) => (
            <select key={f.name} value={filterVal[f.name] ?? ""} onChange={(e) => setFilterVal((s) => ({ ...s, [f.name]: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#0194F3] focus:outline-none">
              <option value="">Semua {f.label}</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <span className="ml-auto text-sm text-slate-400">{filtered.length} data</span>
        </div>
      </div>

      {/* Tabel (yang discroll) */}
      <div className="px-8 pb-6 pt-4">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>{columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}<th className="px-4 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-400">Tidak ada data.</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  {columns.map((c) => <td key={c.key} className="px-4 py-3 text-slate-700">{fmt(row, c)}</td>)}
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(row)} className="mr-2 rounded-lg bg-[#E6F4FE] px-2.5 py-1 text-xs font-bold text-[#0277C2] hover:brightness-95">✏️ Edit</button>
                    <button onClick={() => remove(row)} className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500 hover:bg-red-100">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">{modal.mode === "add" ? `Tambah ${title}` : `Edit ${title}`}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">{f.label}{f.required && <span className="text-red-400"> *</span>}</label>
                  {f.type === "textarea" ? (
                    <textarea value={modal.data[f.name] ?? ""} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.value } })}
                      rows={3} placeholder={f.placeholder} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0194F3] focus:outline-none" />
                  ) : f.type === "select" ? (
                    <select value={modal.data[f.name] ?? ""} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.value } })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0194F3] focus:outline-none">
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={!!modal.data[f.name]} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.checked } })} /> Ya</label>
                  ) : (
                    <input type={f.type} step={f.step} value={modal.data[f.name] ?? ""} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.value } })}
                      placeholder={f.placeholder} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0194F3] focus:outline-none" />
                  )}
                  {f.help && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Batal</button>
              <button onClick={save} disabled={busy} className="rounded-xl bg-[#0194F3] px-5 py-2 text-sm font-bold text-white hover:bg-[#0277C2] disabled:opacity-50">{busy ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
