// app/(consumer)/join-group/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JoinGroupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Gagal bergabung"); return; }
      router.push(`/survey/${data.groupCode}`);
    } catch { setErr("Kesalahan jaringan"); }
    finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link href="/home" className="text-sm font-semibold text-slate-500 hover:underline">← Kembali</Link>
      <div className="mt-3 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="text-4xl">🤝</div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Gabung Grup</h1>
          <p className="mt-1 text-sm text-slate-500">Masukkan kode grup dari Leader-mu.</p>
        </div>

        {err && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">{err}</div>}

        <form onSubmit={join} className="mt-5 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="JJ-XXXX"
            maxLength={10}
            className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest uppercase outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/20"
          />
          <button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="w-full rounded-xl bg-[#0194F3] py-3 font-bold text-white shadow-sm transition hover:bg-[#0277C2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memeriksa..." : "Gabung Sekarang"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Belum punya kode?{" "}
          <Link href="/create-group" className="font-semibold text-[#0194F3] hover:underline">Buat grup sendiri</Link>
        </p>
      </div>
    </main>
  );
}
