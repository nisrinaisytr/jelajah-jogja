// app/(public)/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nama: "", email: "", password: "", umur: "", gender: "Laki-laki", alamat: "", no_telp: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mendaftar");
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/20";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0194F3] to-[#0066b3] p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-8 shadow-md">
        <Link href="/" className="mb-4 inline-block text-sm font-semibold text-[#0194F3] hover:underline">← Kembali ke Beranda</Link>
        <h1 className="text-2xl font-bold text-slate-800">Daftar Akun</h1>
        <p className="mt-1 text-sm text-slate-500">Buat akun untuk mulai merencanakan tour grup.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input required value={form.nama} onChange={(e) => set("nama", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="email@contoh.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password (min 8 karakter)</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Umur</label>
              <input type="number" required min={1} max={120} value={form.umur} onChange={(e) => set("umur", e.target.value)} className={inputCls} />
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
            <textarea required value={form.alamat} onChange={(e) => set("alamat", e.target.value)} className={inputCls} rows={2} placeholder="Sertakan nama kota (mis. ...,  Surabaya)" />
            <p className="mt-1 text-xs text-slate-400">Kota asal akan dideteksi otomatis dari alamat.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">No HP</label>
            <input required value={form.no_telp} onChange={(e) => set("no_telp", e.target.value)} className={inputCls} placeholder="0812xxxxxxxx" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#FF5E1F] py-2.5 font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60">
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-[#0194F3] hover:underline">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
