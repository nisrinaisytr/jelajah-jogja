// components/PublicNavbar.tsx
import Link from "next/link";

export default function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏝️</span>
          <span className="text-lg font-extrabold text-slate-900">
            Jelajah <span className="text-[#0194F3]">Jogja</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/" className="hover:text-[#0194F3]">Beranda</Link>
          <Link href="/eksplorasi" className="hover:text-[#0194F3]">Eksplorasi 75 Wisata</Link>
          <Link href="/#cara-kerja" className="hover:text-[#0194F3]">Cara Kerja</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin-login" className="text-xs text-slate-400 hover:text-slate-600">
            🔒 Admin Login
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-[#0194F3] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0277C2]"
          >
            Masuk
          </Link>
        </div>
      </div>
    </nav>
  );
}
