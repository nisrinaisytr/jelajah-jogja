// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword } from "@/lib/auth";
import type { AppRole } from "@/lib/session-config";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  mode: z.enum(["admin", "consumer"]).default("consumer"),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    const { email, password, mode } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const isAdminRole = user.role === "OWNER" || user.role === "STAFF";
    // Pemisahan admin total (PRD §3)
    if (mode === "admin" && !isAdminRole) {
      return NextResponse.json({ error: "Akun ini bukan akun admin" }, { status: 403 });
    }
    if (mode === "consumer" && isAdminRole) {
      return NextResponse.json(
        { error: "Akun admin harus login lewat Admin Login" },
        { status: 403 }
      );
    }

    // catat login terakhir
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const session = await getSession();
    session.user = {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role as AppRole,
    };
    await session.save();

    return NextResponse.json({ user: session.user });
  } catch (e) {
    console.error("login error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
