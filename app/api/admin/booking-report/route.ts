// app/api/admin/booking-report/route.ts — laporan booking final + export CSV (Owner only)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function ownerGuard() { const s = await getSession(); return s.user?.role === "OWNER" ? s.user : null; }

async function rows() {
  const groups = await prisma.group.findMany({
    where: { status: "BOOKED" },
    orderBy: { bookingDate: "desc" },
    include: {
      leader: { select: { nama: true, no_telp: true } },
      finalPackage: { select: { namaPaket: true, hargaPerOrang: true, durasiHari: true } },
    },
  });
  return groups.map((g) => {
    const harga = g.finalPackage ? Number(g.finalPackage.hargaPerOrang) : 0;
    return {
      code: g.groupCode, groupName: g.groupName, leader: g.leader.nama, leaderPhone: g.leader.no_telp,
      paket: g.finalPackage?.namaPaket ?? "-", durasiHari: g.finalPackage?.durasiHari ?? 0,
      hargaPerOrang: harga, quota: g.totalQuota, revenue: harga * g.totalQuota,
      bookingDate: g.bookingDate ? new Date(g.bookingDate).toISOString().slice(0, 10) : "-",
    };
  });
}

function toCsv(data: Awaited<ReturnType<typeof rows>>): string {
  const head = ["Kode Grup", "Nama Grup", "Leader", "No. Telp", "Paket", "Durasi (hari)", "Harga/Orang", "Kuota", "Total Revenue", "Tanggal Booking"];
  const esc = (v: any) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [head.join(",")];
  for (const r of data) lines.push([r.code, r.groupName, r.leader, r.leaderPhone, r.paket, r.durasiHari, r.hargaPerOrang, r.quota, r.revenue, r.bookingDate].map(esc).join(","));
  return "\uFEFF" + lines.join("\n"); // BOM agar Excel baca UTF-8
}

export async function GET(req: Request) {
  if (!(await ownerGuard())) return NextResponse.json({ error: "Khusus Owner" }, { status: 403 });
  const data = await rows();
  if (new URL(req.url).searchParams.get("format") === "csv") {
    return new Response(toCsv(data), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-booking-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  return NextResponse.json({ rows: data, totalRevenue });
}
