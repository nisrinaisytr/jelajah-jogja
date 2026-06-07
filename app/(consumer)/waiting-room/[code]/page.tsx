// app/(consumer)/waiting-room/[code]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import WaitingRoom from "@/components/WaitingRoom";

export const dynamic = "force-dynamic";

export default async function WaitingRoomPage({ params }: { params: { code: string } }) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const code = params.code.toUpperCase();

  const group = await prisma.group.findUnique({ where: { groupCode: code } });
  if (!group) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">Grup tidak ditemukan</h1>
          <Link href="/home" className="mt-4 inline-block rounded-xl bg-[#0194F3] px-5 py-2.5 font-semibold text-white">Ke Beranda</Link>
        </div>
      </main>
    );
  }

  const member = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: session.user.id } } });
  if (!member || member.removedAt) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">Bukan anggota grup</h1>
          <Link href="/join-group" className="mt-4 inline-block rounded-xl bg-[#0194F3] px-5 py-2.5 font-semibold text-white">Gabung Grup</Link>
        </div>
      </main>
    );
  }

  // Kalau belum submit, arahkan isi kuesioner dulu
  if (!member.hasSubmitted) redirect(`/survey/${code}`);

  return <WaitingRoom groupCode={code} />;
}
