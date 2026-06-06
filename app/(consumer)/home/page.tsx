// app/(consumer)/home/page.tsx
// PLACEHOLDER Tahap 2 (hanya untuk uji auth). Versi lengkap dibuat di Tahap 4.
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function HomePage() {
  const session = await getSession();
  const nama = session.user?.nama ?? "Tamu";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <span className="rounded-lg bg-[#10B981]/10 px-3 py-1 text-xs font-semibold text-[#10B981]">
          LOGIN BERHASIL (KONSUMEN)
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-800">Hai, {nama}! 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ini halaman beranda konsumen (placeholder Tahap 2). Halaman lengkapnya dibuat di Tahap 4.
        </p>
        <div className="mt-6">
          <LogoutButton redirectTo="/login" />
        </div>
      </div>
    </main>
  );
}
