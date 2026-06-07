// app/(consumer)/layout.tsx
// Layout untuk semua halaman konsumen (LEADER/MEMBER). Middleware sudah menjaga akses.
import { getSession } from "@/lib/auth";
import ConsumerNavbar from "@/components/ConsumerNavbar";

export const dynamic = "force-dynamic";

export default async function ConsumerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const nama = session.user?.nama ?? "Pengguna";
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ConsumerNavbar nama={nama} />
      {children}
    </div>
  );
}
