// app/(consumer)/survey/[code]/page.tsx
// Kuesioner BWM Nested 2-Level. Server Component: validasi akses & kesiapan, lalu render wizard (client).
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CRITERIA_MASTER } from "@/lib/criteria-master";
import SurveyWizard from "@/components/SurveyWizard";

export const dynamic = "force-dynamic";

const CRIT_UI: Record<string, { emoji: string }> = {
  K1: { emoji: "🌲" }, K2: { emoji: "💰" }, K3: { emoji: "🚗" }, K4: { emoji: "🚻" },
  K5: { emoji: "📸" }, K6: { emoji: "🛡️" }, K7: { emoji: "🌿" }, K8: { emoji: "👥" },
};

function Notice({ title, desc, href, cta }: { title: string; desc: string; href: string; cta: string }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="text-4xl">📋</div>
        <h1 className="mt-3 text-xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{desc}</p>
        <Link href={href} className="mt-5 inline-block rounded-xl bg-[#0194F3] px-5 py-2.5 font-semibold text-white">{cta}</Link>
      </div>
    </main>
  );
}

export default async function SurveyPage({ params }: { params: { code: string } }) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const userId = session.user.id;
  const code = params.code.toUpperCase();

  const group = await prisma.group.findUnique({ where: { groupCode: code } });
  if (!group) return <Notice title="Grup tidak ditemukan" desc={`Kode "${code}" tidak valid.`} href="/home" cta="Ke Beranda" />;

  const member = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } });
  if (!member || member.removedAt) {
    return <Notice title="Bukan anggota grup" desc="Kamu belum tergabung di grup ini. Gabung dulu dengan kodenya." href="/join-group" cta="Gabung Grup" />;
  }
  if (member.hasSubmitted) {
    return <Notice title="Kamu sudah mengisi kuesioner ✅" desc="Tunggu anggota lain. Pantau progres di Waiting Room." href={`/waiting-room/${code}`} cta="Ke Waiting Room" />;
  }
  if (group.status !== "IN_PROGRESS") {
    return <Notice title="Kuesioner ditutup" desc="Grup ini sudah memasuki tahap hasil." href={`/results/${code}`} cta="Lihat Hasil" />;
  }

  let activeKeys: string[] = [];
  try { activeKeys = JSON.parse(group.activeCriteria); } catch { activeKeys = []; }
  const criteria = CRITERIA_MASTER
    .filter((c) => activeKeys.includes(c.key))
    .map((c) => ({
      key: c.key,
      nama: c.nama,
      emoji: CRIT_UI[c.key]?.emoji ?? "📌",
      sub: c.subKriteria.map((s) => ({ key: s.key, nama: s.nama })), // subkriteria tanpa emoji
    }));

  return <SurveyWizard groupCode={code} groupName={group.groupName} criteria={criteria} />;
}
