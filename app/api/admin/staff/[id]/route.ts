// app/api/admin/staff/[id]/route.ts — edit/aktif-nonaktif/hapus akun internal (Owner only)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function ownerGuard() { const s = await getSession(); return s.user?.role === "OWNER" ? s.user : null; }

const schema = z.object({
  nama: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const owner = await ownerGuard();
  if (!owner) return NextResponse.json({ error: "Khusus Owner" }, { status: 403 });
  const id = Number(params.id);
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target || (target.role !== "STAFF" && target.role !== "OWNER")) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  if (target.role === "OWNER") return NextResponse.json({ error: "Akun Owner tidak bisa diubah dari sini" }, { status: 400 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const data: any = {};
  if (p.data.nama !== undefined) data.nama = p.data.nama;
  if (p.data.isActive !== undefined) data.isActive = p.data.isActive;
  if (p.data.password) data.password = await hashPassword(p.data.password);
  await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const owner = await ownerGuard();
  if (!owner) return NextResponse.json({ error: "Khusus Owner" }, { status: 403 });
  const id = Number(params.id);
  if (id === owner.id) return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  if (target.role !== "STAFF") return NextResponse.json({ error: "Hanya akun Staff yang bisa dihapus" }, { status: 400 });
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2003") return NextResponse.json({ error: "Tidak bisa dihapus: akun terkait data lain. Nonaktifkan saja." }, { status: 400 });
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
