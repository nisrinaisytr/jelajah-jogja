// app/api/auth/change-password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

const schema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
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
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });

    // Tolak kalau password baru sama dengan password lama
    const sama = await verifyPassword(newPassword, user.password);
    if (sama) {
      return NextResponse.json({ error: "Password baru tidak boleh sama dengan password lama" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("change-password error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
