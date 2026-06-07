// app/(consumer)/results/[code]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getKulinerForPackage } from "@/lib/generate-packages";
import ResultsView from "@/components/ResultsView";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: { code: string } }) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const userId = session.user.id;
  const code = params.code.toUpperCase();

  const group = await prisma.group.findUnique({
    where: { groupCode: code },
    include: { members: { where: { removedAt: null }, include: { user: { select: { id: true, nama: true } } } } },
  });
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

  const isMember = group.members.some((m) => m.user.id === userId);
  if (!isMember) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">Bukan anggota grup</h1>
          <Link href="/join-group" className="mt-4 inline-block rounded-xl bg-[#0194F3] px-5 py-2.5 font-semibold text-white">Gabung Grup</Link>
        </div>
      </main>
    );
  }

  // Gatekeeper: kalau belum dihitung, balik ke waiting room
  if (group.status === "IN_PROGRESS") redirect(`/waiting-room/${code}`);

  const isLeader = group.leaderId === userId;

  // 3 paket + hotel + itinerary
  const pkgRows = await prisma.tourPackage.findMany({
    where: { groupId: group.id },
    orderBy: { hargaPerOrang: "asc" },
    include: {
      hotel: true,
      itinerary: { orderBy: [{ hariKe: "asc" }, { urutanRute: "asc" }], include: { destination: true } },
    },
  });

  const packages = await Promise.all(
    pkgRows.map(async (p) => {
      const kuliner = await getKulinerForPackage(p.id);
      // group itinerary per hari
      const days: Record<number, any[]> = {};
      for (const it of p.itinerary) {
        (days[it.hariKe] ??= []).push({
          urutanRute: it.urutanRute, estimasiJam: it.estimasiJam, waktuKunjungan: it.waktuKunjungan,
          jarakDariSebelum: it.jarakDariSebelum,
          dest: { id: it.destination.id, nama: it.destination.nama, kategori: it.destination.kategori, wilayah: it.destination.wilayah, hargaTiket: it.destination.hargaTiket, imageUrl: it.destination.imageUrl },
        });
      }
      return {
        id: p.id, variant: p.variant, namaPaket: p.namaPaket, hargaPerOrang: Number(p.hargaPerOrang),
        durasiHari: p.durasiHari, jenisArmada: p.jenisArmada,
        hotel: { nama: p.hotel.nama, tier: p.hotel.tier, hargaPerMalam: p.hotel.hargaPerMalam, rating: p.hotel.rating, wilayah: p.hotel.wilayah, alamat: p.hotel.alamat },
        days: Object.entries(days).map(([hari, stops]) => ({ hari: Number(hari), stops })).sort((a, b) => a.hari - b.hari),
        kuliner: kuliner.map((k) => ({ nama: k.nama, jenis: k.jenis, rating: k.rating, hargaRataRata: k.hargaRataRata })),
      };
    })
  );

  // Top 10 TOPSIS
  const topRows = await prisma.groupTopsisResult.findMany({
    where: { groupId: group.id }, orderBy: { ranking: "asc" }, take: 10,
    include: { destination: { select: { nama: true, kategori: true, wilayah: true } } },
  });
  const top10 = topRows.map((r) => ({ ranking: r.ranking, ciScore: r.ciScore, nama: r.destination.nama, kategori: r.destination.kategori, wilayah: r.destination.wilayah }));

  const members = group.members.map((m) => ({ nama: m.user.nama, isLeader: m.user.id === group.leaderId }));

  return (
    <ResultsView
      groupCode={code}
      groupName={group.groupName}
      status={group.status}
      isLeader={isLeader}
      finalPackageId={group.finalPackageId}
      packages={packages}
      top10={top10}
      members={members}
    />
  );
}
