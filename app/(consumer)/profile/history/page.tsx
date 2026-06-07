// app/(consumer)/profile/history/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import HistoryTabs, { GroupCard } from "@/components/HistoryTabs";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const userId = session.user.id;

  // Grup sebagai LEADER
  const ledGroups = await prisma.group.findMany({
    where: { leaderId: userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } }, finalPackage: true, members: { where: { userId } } },
  });

  // Grup sebagai MEMBER (bukan yang dia pimpin)
  const memberships = await prisma.groupMember.findMany({
    where: { userId, removedAt: null, group: { leaderId: { not: userId } } },
    orderBy: { joinedAt: "desc" },
    include: { group: { include: { _count: { select: { members: true } }, finalPackage: true } } },
  });

  const leaderGroups: GroupCard[] = ledGroups.map((g) => ({
    id: g.id, groupCode: g.groupCode, groupName: g.groupName, status: g.status,
    durasiTour: g.durasiTour, memberCount: g._count.members,
    finalPackageNama: g.finalPackage?.namaPaket ?? null,
    hasSubmitted: g.members[0]?.hasSubmitted ?? false,
  }));

  const memberGroups: GroupCard[] = memberships.map((m) => ({
    id: m.group.id, groupCode: m.group.groupCode, groupName: m.group.groupName, status: m.group.status,
    durasiTour: m.group.durasiTour, memberCount: m.group._count.members,
    finalPackageNama: m.group.finalPackage?.namaPaket ?? null,
    hasSubmitted: m.hasSubmitted,
  }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Riwayat Grup Saya</h1>
      <p className="mb-6 text-sm text-slate-500">Semua grup yang kamu buat atau ikuti.</p>
      <HistoryTabs leaderGroups={leaderGroups} memberGroups={memberGroups} />
    </main>
  );
}
