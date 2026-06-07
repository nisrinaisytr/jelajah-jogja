// app/(consumer)/home/page.tsx
// Beranda konsumen pasca-login. Server Component.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import DestImage from "@/components/DestImage";
import { formatRupiah } from "@/lib/destinasi-helpers";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: { label: "Berlangsung", cls: "bg-[#FEF3C7] text-[#F59E0B]" },
  COMPLETED: { label: "Selesai", cls: "bg-[#ECFDF5] text-[#10B981]" },
  BOOKED: { label: "Dipesan", cls: "bg-[#E6F4FE] text-[#0194F3]" },
};

function groupHref(status: string, hasSubmitted: boolean, code: string) {
  if (status === "IN_PROGRESS") return hasSubmitted ? `/waiting-room/${code}` : `/survey/${code}`;
  return `/results/${code}`;
}

interface Riw { id: number; code: string; name: string; status: string; durasi: number; memberCount: number; hasSubmitted: boolean; isLeader: boolean; createdAt: Date }

export default async function HomePage() {
  const session = await getSession();
  const userId = session.user?.id ?? 0;
  const nama = session.user?.nama ?? "Pengguna";

  // Gabung: grup yang DIPIMPIN + grup yang DIIKUTI (sama seperti halaman Riwayat)
  const [ledGroups, memberships, populer] = await Promise.all([
    prisma.group.findMany({
      where: { leaderId: userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } }, members: { where: { userId } } },
    }),
    prisma.groupMember.findMany({
      where: { userId, removedAt: null, group: { leaderId: { not: userId } } },
      orderBy: { joinedAt: "desc" },
      include: { group: { include: { _count: { select: { members: true } } } } },
    }),
    prisma.destination.findMany({
      orderBy: { rating: "desc" }, take: 6,
      select: { id: true, nama: true, kategori: true, wilayah: true, hargaTiket: true, rating: true, imageUrl: true, jarakPusat: true },
    }),
  ]);

  const riwayat: Riw[] = [
    ...ledGroups.map((g) => ({ id: g.id, code: g.groupCode, name: g.groupName, status: g.status, durasi: g.durasiTour, memberCount: g._count.members, hasSubmitted: g.members[0]?.hasSubmitted ?? false, isLeader: true, createdAt: g.createdAt })),
    ...memberships.map((m) => ({ id: m.group.id, code: m.group.groupCode, name: m.group.groupName, status: m.group.status, durasi: m.group.durasiTour, memberCount: m.group._count.members, hasSubmitted: m.hasSubmitted, isLeader: false, createdAt: m.group.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Hai, {nama}! 👋</h1>
      <p className="mt-1 text-slate-500">Siap merencanakan tour grup berikutnya?</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href="/create-group" className="orange-gradient flex flex-col justify-between rounded-2xl p-6 text-white shadow-lg transition hover:shadow-xl">
          <div className="text-3xl">👑</div>
          <div>
            <div className="mt-3 text-xl font-extrabold">Buat Grup Baru</div>
            <div className="text-sm text-orange-50">Jadi Leader, tentukan durasi & kriteria, lalu undang anggota.</div>
          </div>
        </Link>
        <Link href="/join-group" className="flex flex-col justify-between rounded-2xl bg-[#0194F3] p-6 text-white shadow-lg transition hover:shadow-xl">
          <div className="text-3xl">🤝</div>
          <div>
            <div className="mt-3 text-xl font-extrabold">Gabung Grup</div>
            <div className="text-sm text-blue-50">Punya kode JJ-XXXX? Masuk ke grup & isi kuesioner.</div>
          </div>
        </Link>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Riwayat Terakhir</h2>
          <Link href="/profile/history" className="text-sm font-semibold text-[#0194F3] hover:underline">Lihat semua →</Link>
        </div>
        {riwayat.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
            Belum ada grup. Yuk buat grup pertama atau gabung pakai kode!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {riwayat.map((r) => {
              const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.IN_PROGRESS;
              return (
                <Link key={r.id} href={groupHref(r.status, r.hasSubmitted, r.code)}
                  className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-700">{r.code}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div className="mt-2 font-bold text-slate-800">{r.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {r.isLeader ? "👑 Sebagai Leader" : "👤 Sebagai Member"} • {r.memberCount} anggota • {r.durasi} hari
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#0194F3]">{r.status === "IN_PROGRESS" && !r.hasSubmitted ? "Lanjutkan kuesioner →" : r.status === "IN_PROGRESS" ? "Lihat progres →" : "Lihat hasil →"}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Populer di Jogja</h2>
          <Link href="/eksplorasi" className="text-sm font-semibold text-[#0194F3] hover:underline">Lihat semua →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {populer.map((d) => (
            <Link key={d.id} href={`/eksplorasi/${d.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden">
                <DestImage src={d.imageUrl} alt={d.nama} kategori={d.kategori} className="h-full w-full" />
                <div className="absolute left-2 top-2 rounded-full bg-[#FF5E1F] px-2.5 py-0.5 text-[10px] font-bold text-white">{d.kategori}</div>
                <div className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-0.5 text-[10px] font-bold">⭐ {d.rating}</div>
              </div>
              <div className="p-4">
                <div className="mb-1 text-sm font-bold text-slate-900">{d.nama}</div>
                <div className="mb-2 text-[10px] text-slate-500">📍 {d.wilayah} • {d.jarakPusat} km</div>
                <div className="text-sm font-bold text-[#FF5E1F]">{formatRupiah(d.hargaTiket)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
