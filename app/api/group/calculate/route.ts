// app/api/group/calculate/route.ts
// Jalankan kalkulasi grup (agregasi + TOPSIS) ketika semua anggota sudah submit. Idempoten.
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { runGroupCalculation } from "@/lib/run-calculation";

const schema = z.object({ groupCode: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    const userId = session.user.id;

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const group = await prisma.group.findUnique({ where: { groupCode: parsed.data.groupCode.toUpperCase() } });
    if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });

    const me = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } });
    if (!me || me.removedAt) return NextResponse.json({ error: "Bukan anggota grup" }, { status: 403 });

    const [active, submitted] = await Promise.all([
      prisma.groupMember.count({ where: { groupId: group.id, removedAt: null } }),
      prisma.groupMember.count({ where: { groupId: group.id, removedAt: null, hasSubmitted: true } }),
    ]);
    if (active < 2 || active !== submitted) {
      return NextResponse.json({ error: "Butuh minimal 2 anggota & semua sudah mengisi kuesioner" }, { status: 400 });
    }

    const summary = await runGroupCalculation(group.id);
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    console.error("group/calculate error:", e);
    return NextResponse.json({ error: "Gagal menghitung. Coba lagi." }, { status: 500 });
  }
}
