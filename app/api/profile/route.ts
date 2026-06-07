// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { extractKota } from "@/lib/extract-kota";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  umur: z.coerce.number().int().min(1).max(120),
  gender: z.enum(["Laki-laki", "Perempuan"]),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  no_telp: z.string().min(1, "No HP wajib diisi"),
});

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const d = parsed.data;
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nama: d.nama,
        umur: d.umur,
        gender: d.gender,
        alamat: d.alamat,
        kotaAsal: extractKota(d.alamat), // re-ekstrak kalau alamat berubah
        no_telp: d.no_telp,
      },
      select: { nama: true, kotaAsal: true },
    });

    // sinkronkan nama di session (dipakai navbar)
    session.user = { ...session.user, nama: user.nama };
    await session.save();

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error("profile update error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
