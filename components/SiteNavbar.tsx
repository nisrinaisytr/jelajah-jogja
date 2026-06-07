// components/SiteNavbar.tsx
// Navbar "pintar" untuk halaman publik: kalau user sudah login (konsumen) -> tampilkan
// ConsumerNavbar (avatar), kalau tamu -> PublicNavbar (Masuk / Admin Login).
import { getSession } from "@/lib/auth";
import PublicNavbar from "@/components/PublicNavbar";
import ConsumerNavbar from "@/components/ConsumerNavbar";

export default async function SiteNavbar() {
  const session = await getSession();
  const u = session.user;
  if (u && (u.role === "LEADER" || u.role === "MEMBER")) {
    return <ConsumerNavbar nama={u.nama} />;
  }
  return <PublicNavbar />;
}
