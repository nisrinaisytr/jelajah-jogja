// app/api/admin/staff/route.ts — kelola akun internal (Owner only)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function ownerGuard() { const s = await getSession(); return s.user?.role === "OWNER" ? s.user : null; }

export async function GET() {
  if (!(await ownerGuard())) return NextResponse.json({ error: "Khusus Owner" }, { status: 403 });
  const users = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "STAFF"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, nama: true, email: true, role: true, isActive: true, no_telp: true, lastLoginAt: true, createdAt: true },
  });
  return NextResponse.json({ rows: users });
}

const schema = z.object({
  nama: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  no_telp: z.string().optional(),
});

export async function POST(req: Request) {
  const owner = await ownerGuard();
  if (!owner) return NextResponse.json({ error: "Khusus Owner" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  const exist = await prisma.user.findUnique({ where: { email: p.data.email.toLowerCase() } });
  if (exist) return NextResponse.json({ error: "Email sudah terpakai" }, { status: 400 });
  await prisma.user.create({
    data: {
      nama: p.data.nama, email: p.data.email.toLowerCase(), password: await hashPassword(p.data.password),
      role: "STAFF", isActive: true,
      umur: 25, gender: "Laki-laki", alamat: "-", no_telp: p.data.no_telp || "-",
    },
  });
  return NextResponse.json({ ok: true });
}
