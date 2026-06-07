// app/api/group/join/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  groupCode: z.string().min(1, "Kode grup wajib diisi").max(10),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const groupCode = parsed.data.groupCode.trim().toUpperCase();
    const userId = session.user.id;

    const group = await prisma.group.findUnique({ where: { groupCode } });
    if (!group) {
      return NextResponse.json({ error: "Kode grup tidak ditemukan" }, { status: 404 });
    }
    if (group.status === "BOOKED") {
      return NextResponse.json({ error: "Grup ini sudah final (booked) dan tidak menerima anggota baru" }, { status: 400 });
    }

    // Sudah jadi anggota?
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) {
      if (existing.removedAt) {
        return NextResponse.json({ error: "Anda telah dikeluarkan dari grup ini" }, { status: 403 });
      }
      // sudah anggota -> langsung arahkan ke kuesioner
      return NextResponse.json({ ok: true, groupCode: group.groupCode, already: true });
    }

    // Cek kuota (hitung anggota aktif)
    const activeCount = await prisma.groupMember.count({
      where: { groupId: group.id, removedAt: null },
    });
    if (activeCount >= group.totalQuota) {
      return NextResponse.json({ error: "Grup sudah penuh" }, { status: 400 });
    }

    await prisma.groupMember.create({
      data: { groupId: group.id, userId, hasSubmitted: false },
    });

    return NextResponse.json({ ok: true, groupCode: group.groupCode });
  } catch (e) {
    console.error("group/join error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
