// app/admin/dashboard/page.tsx
// PLACEHOLDER Tahap 2 (hanya untuk uji auth). Versi lengkap (Live Tracker) dibuat di Tahap 10.
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const u = session.user;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
        <span className="rounded-lg bg-[#0194F3]/15 px-3 py-1 text-xs font-semibold text-[#0194F3]">
          PANEL ADMIN
        </span>
        <h1 className="mt-3 text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-slate-400">
          Masuk sebagai <b className="text-white">{u?.nama}</b> — role <b className="text-white">{u?.role}</b>.
        </p>
        <p className="mt-1 text-xs text-slate-500">Placeholder Tahap 2. Live Tracker dibuat di Tahap 10.</p>
        <div className="mt-6">
          <LogoutButton redirectTo="/admin-login" />
        </div>
      </div>
    </main>
  );
}
