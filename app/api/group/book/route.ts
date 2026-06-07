// app/api/group/book/route.ts
// Leader "Ketuk Palu": pilih paket final -> status BOOKED. Cegah double-booking.
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ groupCode: z.string().min(1), packageId: z.coerce.number().int() });

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    const userId = session.user.id;

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    const { groupCode, packageId } = parsed.data;

    const group = await prisma.group.findUnique({ where: { groupCode: groupCode.toUpperCase() } });
    if (!group) return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });

    // Hanya Leader
    if (group.leaderId !== userId) {
      return NextResponse.json({ error: "Hanya Leader yang dapat memilih paket" }, { status: 403 });
    }
    // Cegah double-booking
    if (group.finalPackageId !== null || group.status === "BOOKED") {
      return NextResponse.json({ error: "Paket final sudah dipilih sebelumnya" }, { status: 400 });
    }
    // Paket harus milik grup ini
    const pkg = await prisma.tourPackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.groupId !== group.id) {
      return NextResponse.json({ error: "Paket tidak valid untuk grup ini" }, { status: 400 });
    }

    await prisma.group.update({
      where: { id: group.id },
      data: { status: "BOOKED", finalPackageId: packageId, bookingDate: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("group/book error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
