// components/admin/AccountManager.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah } from "@/lib/destinasi-helpers";

interface BookingRow { code: string; groupName: string; leader: string; leaderPhone: string; paket: string; durasiHari: number; hargaPerOrang: number; quota: number; revenue: number; bookingDate: string }
interface Acc { id: number; nama: string; email: string; role: string; isActive: boolean; no_telp: string; lastLoginAt: string | null; createdAt: string }

const TABS_H = 53;

/* ---------- Laporan Booking ---------- */
function BookingReport() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/admin/booking-report", { cache: "no-store" });
      const d = await r.json();
      if (r.ok) { setRows(d.rows ?? []); setTotal(d.totalRevenue ?? 0); } else setErr(d.error ?? "Gagal memuat");
    } catch { setErr("Kesalahan jaringan"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="sticky z-20 border-b border-slate-200/70 bg-[#F1F5F9] px-8 pb-3 pt-6" style={{ top: TABS_H }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">🧾 Laporan Booking Final</h1>
            <p className="text-sm text-slate-500">Semua grup yang sudah ketuk palu. Total revenue: <b className="text-[#10B981]">{formatRupiah(total)}</b></p>
          </div>
          <a href="/api/admin/booking-report?format=csv"
            className="rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-95">⬇️ Export CSV</a>
        </div>
      </div>

      <div className="px-8 pb-6 pt-4">
        {loading ? <div className="py-10 text-center text-slate-400">Memuat...</div>
          : err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">{err}</div>
          : rows.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">Belum ada grup yang dipesan.</div>
          : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <tr><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Grup</th><th className="px-4 py-3">Leader</th><th className="px-4 py-3">Paket</th><th className="px-4 py-3 text-right">Harga/Org</th><th className="px-4 py-3 text-center">Kuota</th><th className="px-4 py-3 text-right">Revenue</th><th className="px-4 py-3">Tanggal</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-[#0277C2]">{r.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{r.groupName}</td>
                      <td className="px-4 py-3 text-slate-600">{r.leader}<div className="text-[10px] text-slate-400">{r.leaderPhone}</div></td>
                      <td className="px-4 py-3 text-slate-600">{r.paket}<div className="text-[10px] text-slate-400">{r.durasiHari} hari</div></td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(r.hargaPerOrang)}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{r.quota}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#10B981]">{formatRupiah(r.revenue)}</td>
                      <td className="px-4 py-3 text-slate-500">{r.bookingDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

/* ---------- Akun Internal ---------- */
function StaffAccounts({ selfId }: { selfId: number }) {
  const [rows, setRows] = useState<Acc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nama: "", email: "", password: "", no_telp: "" });
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { const r = await fetch("/api/admin/staff", { cache: "no-store" }); const d = await r.json(); if (r.ok) setRows(d.rows ?? []); else setErr(d.error ?? "Gagal memuat"); }
    catch { setErr("Kesalahan jaringan"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function addStaff() {
    setBusy(true); setFormErr("");
    try {
      const r = await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setFormErr(d.error ?? "Gagal menambah"); return; }
      setModal(false); setForm({ nama: "", email: "", password: "", no_telp: "" }); load();
    } catch { setFormErr("Kesalahan jaringan"); } finally { setBusy(false); }
  }
  async function toggleActive(a: Acc) {
    const r = await fetch(`/api/admin/staff/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !a.isActive }) });
    if (r.ok) load(); else alert((await r.json()).error ?? "Gagal");
  }
  async function resetPw(a: Acc) {
    const pw = prompt(`Password baru untuk ${a.nama} (min 6 karakter):`);
    if (!pw) return;
    const r = await fetch(`/api/admin/staff/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    alert(r.ok ? "Password diperbarui." : ((await r.json()).error ?? "Gagal"));
  }
  async function del(a: Acc) {
    if (!confirm(`Hapus akun staff "${a.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const r = await fetch(`/api/admin/staff/${a.id}`, { method: "DELETE" });
    if (r.ok) load(); else alert((await r.json()).error ?? "Gagal");
  }

  return (
    <div>
      <div className="sticky z-20 border-b border-slate-200/70 bg-[#F1F5F9] px-8 pb-3 pt-6" style={{ top: TABS_H }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">👥 Akun Internal</h1>
            <p className="text-sm text-slate-500">Kelola akun Owner & Staff operasional. Akun baru otomatis berperan STAFF.</p>
          </div>
          <button onClick={() => { setFormErr(""); setModal(true); }} className="orange-gradient rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl">+ Tambah Staff</button>
        </div>
      </div>

      <div className="px-8 pb-6 pt-4">
        {loading ? <div className="py-10 text-center text-slate-400">Memuat...</div>
          : err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">{err}</div>
          : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Login Terakhir</th><th className="px-4 py-3 text-right">Aksi</th></tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-700">{a.nama}{a.id === selfId && <span className="ml-1 text-[10px] text-slate-400">(Anda)</span>}</td>
                      <td className="px-4 py-3 text-slate-600">{a.email}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.role === "OWNER" ? "bg-[#EDE9FE] text-[#6D28D9]" : "bg-[#E6F4FE] text-[#0277C2]"}`}>{a.role}</span></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.isActive ? "bg-[#ECFDF5] text-[#047857]" : "bg-slate-100 text-slate-500"}`}>{a.isActive ? "Aktif" : "Nonaktif"}</span></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("id-ID") : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {a.role === "STAFF" ? (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => toggleActive(a)} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200">{a.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                            <button onClick={() => resetPw(a)} className="rounded-lg bg-[#E6F4FE] px-2.5 py-1 text-xs font-bold text-[#0277C2] hover:brightness-95">🔑</button>
                            <button onClick={() => del(a)} className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500 hover:bg-red-100">🗑️</button>
                          </div>
                        ) : <span className="text-[11px] text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-extrabold text-slate-900">Tambah Akun Staff</h3>
            {formErr && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formErr}</div>}
            <div className="space-y-3">
              {([["nama", "Nama Lengkap", "text"], ["email", "Email", "email"], ["password", "Password (min 6)", "password"], ["no_telp", "No. Telp (opsional)", "text"]] as const).map(([k, label, type]) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
                  <input type={type} value={(form as any)[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0194F3] focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModal(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Batal</button>
              <button onClick={addStaff} disabled={busy} className="rounded-xl bg-[#0194F3] px-5 py-2 text-sm font-bold text-white hover:bg-[#0277C2] disabled:opacity-50">{busy ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountManager({ selfId }: { selfId: number }) {
  const [tab, setTab] = useState<"booking" | "staff">("booking");
  const TABS = [{ key: "booking", label: "🧾 Laporan Booking" }, { key: "staff", label: "👥 Akun Internal" }] as const;
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
      {tab === "booking" ? <BookingReport /> : <StaffAccounts selfId={selfId} />}
    </div>
  );
}
