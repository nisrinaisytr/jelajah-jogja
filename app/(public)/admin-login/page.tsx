// app/(public)/admin-login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk");
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-md">
        <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
          🔒 PANEL ADMIN
        </div>
        <h1 className="text-2xl font-bold text-white">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-400">Khusus Owner & Staff Jelajah Jogja.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/30"
              placeholder="owner@jelajahjogja.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/30"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0194F3] py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0181d6] disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk sebagai Admin"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300 hover:underline">← Kembali ke beranda</Link>
        </p>
      </div>
    </main>
  );
}
