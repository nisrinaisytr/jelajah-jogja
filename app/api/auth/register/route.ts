// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { extractKota } from "@/lib/extract-kota";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  nama: z.string().min(1, "Nama wajib diisi"),
  umur: z.coerce.number().int().min(1).max(120),
  gender: z.enum(["Laki-laki", "Perempuan"]),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  no_telp: z.string().min(1, "No HP wajib diisi"),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: d.email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email: d.email,
        password: await hashPassword(d.password),
        nama: d.nama,
        umur: d.umur,
        gender: d.gender,
        alamat: d.alamat,
        kotaAsal: extractKota(d.alamat), // auto-ekstrak untuk analytics & peta
        no_telp: d.no_telp,
        role: "MEMBER",
      },
    });

    const session = await getSession();
    session.user = { id: user.id, email: user.email, nama: user.nama, role: "MEMBER" };
    await session.save();

    return NextResponse.json({ user: session.user });
  } catch (e) {
    console.error("register error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
