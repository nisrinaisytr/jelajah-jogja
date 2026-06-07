// components/admin/AdminSidebar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const MENUS = [
  { label: "Live Tracker", icon: "📊", path: "/admin/dashboard", ownerOnly: false },
  { label: "Operational Insights", icon: "💡", path: "/admin/insights", ownerOnly: false },
  { label: "Strategic BI", icon: "🧠", path: "/admin/branch", ownerOnly: true },
  { label: "Kelola Kriteria & Wisata", icon: "📋", path: "/admin/product", ownerOnly: false },
  { label: "Master Hotel", icon: "🏨", path: "/admin/hotel", ownerOnly: false },
  { label: "Master Kuliner", icon: "🍗", path: "/admin/kuliner", ownerOnly: false },
  { label: "Manajemen Akun", icon: "👥", path: "/admin/staff", ownerOnly: true },
];

export default function AdminSidebar({ role, nama }: { role: string; nama: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin-login");
    router.refresh();
  }

  const items = MENUS.filter((m) => !m.ownerOnly || role === "OWNER");

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="text-2xl">🏝️</span>
        <div>
          <div className="text-sm font-extrabold text-white">Jelajah <span className="text-[#0194F3]">Jogja</span></div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Panel Admin</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((m) => {
          const active = pathname === m.path || pathname.startsWith(m.path + "/");
          return (
            <Link key={m.path} href={m.path}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#0194F3] text-white shadow" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
              <span className="text-base">{m.icon}</span>{m.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF5E1F] text-xs font-bold text-white">{nama?.[0]?.toUpperCase() ?? "A"}</span>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">{nama}</div>
            <div className="text-[10px] uppercase text-slate-500">{role}</div>
          </div>
        </div>
        <button onClick={logout} className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-400 hover:bg-red-500/10">🚪 Keluar</button>
      </div>
    </aside>
  );
}
