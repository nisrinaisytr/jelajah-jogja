// components/ConsumerNavbar.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConsumerNavbar({ nama }: { nama: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = (nama?.trim()?.[0] ?? "U").toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-2xl">🏝️</span>
          <span className="text-lg font-extrabold text-slate-900">
            Jelajah <span className="text-[#0194F3]">Jogja</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/home" className="hover:text-[#0194F3]">Beranda</Link>
          <Link href="/eksplorasi" className="hover:text-[#0194F3]">Eksplorasi</Link>
          <Link href="/profile/history" className="hover:text-[#0194F3]">Riwayat Grup</Link>
        </div>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition hover:shadow-sm"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0194F3] text-sm font-bold text-white">{initial}</span>
            <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 sm:inline">{nama}</span>
            <span className="text-xs text-slate-400">▾</span>
          </button>

          {open && (
            <>
              {/* backdrop untuk klik di luar */}
              <button className="fixed inset-0 z-40 cursor-default" aria-label="Tutup menu" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-md">
                <Link href="/profile" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">👤 Profil Saya</Link>
                <Link href="/profile/history" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">📋 Riwayat Grup</Link>
                <button onClick={logout} className="block w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50">🚪 Keluar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
