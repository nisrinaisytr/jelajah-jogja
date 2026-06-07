// app/api/group/[code]/status/route.ts
// Polling status grup untuk Waiting Room.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  const userId = session.user.id;
  const code = params.code.toUpperCase();

  const group = await prisma.group.findUnique({
    where: { groupCode: code },
    include: {
      members: {
        where: { removedAt: null },
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, nama: true } } },
      },
    },
  });
  if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });

  const isMember = group.members.some((m) => m.user.id === userId);
  if (!isMember) return NextResponse.json({ error: "Bukan anggota grup" }, { status: 403 });

  const members = group.members.map((m) => ({
    nama: m.user.nama,
    hasSubmitted: m.hasSubmitted,
    isLeader: m.user.id === group.leaderId,
    isMe: m.user.id === userId,
  }));
  const total = members.length;
  const submitted = members.filter((m) => m.hasSubmitted).length;
  const allSubmitted = total >= 2 && submitted === total; // min 2 anggota

  const calcCount = await prisma.groupTopsisResult.count({ where: { groupId: group.id } });
  const calculated = calcCount > 0;

  let top5: { nama: string; ciScore: number; ranking: number }[] = [];
  if (calculated) {
    const rows = await prisma.groupTopsisResult.findMany({
      where: { groupId: group.id },
      orderBy: { ranking: "asc" },
      take: 5,
      include: { destination: { select: { nama: true } } },
    });
    top5 = rows.map((r) => ({ nama: r.destination.nama, ciScore: r.ciScore, ranking: r.ranking }));
  }

  let packages: { nama: string; variant: string; harga: number }[] = [];
  if (calculated) {
    const pkgs = await prisma.tourPackage.findMany({
      where: { groupId: group.id },
      orderBy: { hargaPerOrang: "asc" },
      select: { namaPaket: true, variant: true, hargaPerOrang: true },
    });
    packages = pkgs.map((p) => ({ nama: p.namaPaket, variant: p.variant, harga: Number(p.hargaPerOrang) }));
  }

  return NextResponse.json({
    groupName: group.groupName,
    groupCode: group.groupCode,
    status: group.status,
    members, total, submitted, allSubmitted, calculated, top5, packages,
  });
}
