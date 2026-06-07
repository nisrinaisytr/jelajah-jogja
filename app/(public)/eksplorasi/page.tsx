// app/(public)/eksplorasi/page.tsx
// Server wrapper: render navbar (sadar login) + konten eksplorasi (client).
import SiteNavbar from "@/components/SiteNavbar";
import EksplorasiClient from "@/components/EksplorasiClient";

export const dynamic = "force-dynamic";

export default function EksplorasiPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteNavbar />
      <EksplorasiClient />
    </div>
  );
}
