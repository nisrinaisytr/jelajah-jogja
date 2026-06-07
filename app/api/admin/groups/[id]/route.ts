// app/api/admin/groups/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  const u = s.user;
  if (!u || (u.role !== "OWNER" && u.role !== "STAFF")) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const group = await prisma.group.findUnique({
    where: { id: Number(params.id) },
    include: {
      leader: { select: { nama: true } },
      members: { where: { removedAt: null }, include: { user: { select: { id: true, nama: true } } } },
      tourPackages: {
        orderBy: { id: "asc" },
        include: { hotel: { select: { nama: true } }, itinerary: { orderBy: [{ hariKe: "asc" }, { urutanRute: "asc" }], include: { destination: { select: { nama: true } } } } },
      },
    },
  });
  if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });

  const members = group.members.map((m) => ({ nama: m.user.nama, hasSubmitted: m.hasSubmitted, isLeader: m.user.id === group.leaderId }));
  const packages = group.tourPackages.map((p) => ({
    id: p.id, nama: p.namaPaket, harga: Number(p.hargaPerOrang), durasiHari: p.durasiHari, armada: p.jenisArmada,
    hotel: p.hotel?.nama ?? "-",
    destinations: p.itinerary.map((it) => it.destination.nama),
  }));

  return NextResponse.json({
    status: group.status, code: group.groupCode, name: group.groupName, leader: group.leader.nama,
    quota: group.totalQuota, joined: group.members.length, submitted: group.members.filter((m) => m.hasSubmitted).length,
    finalPackageId: group.finalPackageId, members, packages,
  });
}
