// components/ProfileForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  email: string; role: string; nama: string; umur: number;
  gender: string; alamat: string; no_telp: string; kotaAsal: string | null;
}

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/20";

export default function ProfileForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nama: user.nama, umur: String(user.umur), gender: user.gender,
    alamat: user.alamat, no_telp: user.no_telp,
  });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // password
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm({ ...form, [k]: v }); }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Gagal menyimpan" }); return; }
      setMsg({ type: "ok", text: "Profil berhasil diperbarui." });
      router.refresh();
    } catch { setMsg({ type: "err", text: "Kesalahan jaringan" }); }
    finally { setSaving(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null); setPwSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pw),
      });
      const data = await res.json();
      if (!res.ok) { setPwMsg({ type: "err", text: data.error ?? "Gagal mengubah password" }); return; }
      setPwMsg({ type: "ok", text: "Password berhasil diubah." });
      setPw({ currentPassword: "", newPassword: "" });
    } catch { setPwMsg({ type: "err", text: "Kesalahan jaringan" }); }
    finally { setPwSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Kartu identitas */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0194F3] text-2xl font-bold text-white">
          {user.nama?.[0]?.toUpperCase() ?? "U"}
        </span>
        <div>
          <div className="text-xl font-bold text-slate-800">{user.nama}</div>
          <div className="text-sm text-slate-500">{user.email}</div>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{user.role}</span>
        </div>
      </div>

      {/* Edit demografi */}
      <form onSubmit={saveProfile} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Data Diri</h2>
        {msg && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${msg.type === "ok" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-red-50 text-red-600"}`}>{msg.text}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input value={form.nama} onChange={(e) => set("nama", e.target.value)} className={inputCls} required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Umur</label>
              <input type="number" min={1} max={120} value={form.umur} onChange={(e) => set("umur", e.target.value)} className={inputCls} required />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
            <textarea value={form.alamat} onChange={(e) => set("alamat", e.target.value)} className={inputCls} rows={2} required />
            <p className="mt-1 text-xs text-slate-400">Kota asal saat ini: <b>{user.kotaAsal ?? "-"}</b> (otomatis dari alamat).</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">No HP</label>
            <input value={form.no_telp} onChange={(e) => set("no_telp", e.target.value)} className={inputCls} required />
          </div>
        </div>
        <button type="submit" disabled={saving} className="mt-5 rounded-xl bg-[#0194F3] px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0277C2] disabled:opacity-60">
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>

      {/* Ubah password */}
      <form onSubmit={changePassword} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Ubah Password</h2>
        {pwMsg && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${pwMsg.type === "ok" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-red-50 text-red-600"}`}>{pwMsg.text}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Password Saat Ini</label>
            <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password Baru (min 8 karakter)</label>
            <input type="password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={inputCls} required />
          </div>
        </div>
        <button type="submit" disabled={pwSaving} className="mt-5 rounded-xl border-2 border-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
          {pwSaving ? "Memproses..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );
}
