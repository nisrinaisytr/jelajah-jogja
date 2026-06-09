// app/api/admin/bi/route.ts — Strategic BI (Owner only). JSON, atau CSV via ?format=csv.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getStrategicKpis, getWeightsByAgeSegment, getWeightsByGender, getTopKota,
  getOriginMap, getConversionTrend, getPackageRevenue, getDemographics, generateAIInsight,
} from "@/lib/strategic-analytics";

export const dynamic = "force-dynamic";

async function gather() {
  const [kpi, age, gender, topKota, originMap, trend, pkg, demo] = await Promise.all([
    getStrategicKpis(), getWeightsByAgeSegment(), getWeightsByGender(), getTopKota(),
    getOriginMap(), getConversionTrend(), getPackageRevenue(), getDemographics(),
  ]);
  const insight = generateAIInsight({ kpi, age, topKota, pkg });
  return { kpi, age, gender, topKota, originMap, trend, pkg, demo, insight };
}

const esc = (v: any) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const row = (a: any[]) => a.map(esc).join(",");

function toCsv(d: Awaited<ReturnType<typeof gather>>): string {
  const L: string[] = [];
  L.push("== KPI ==");
  L.push(row(["Metrik", "Nilai"]));
  L.push(row(["Total Wisatawan", d.kpi.totalWisatawan]));
  L.push(row(["Total Grup", d.kpi.totalGrup]));
  L.push(row(["Grup Dipesan", d.kpi.bookedGrup]));
  L.push(row(["Grup Selesai", d.kpi.completedGrup]));
  L.push(row(["Konversi (%)", d.kpi.conversionRate]));
  L.push(row(["Total Revenue (Rp)", d.kpi.totalRevenue]));
  L.push("");

  const matrix = (title: string, m: { criteria: { key: string; nama: string }[]; segments: { segment: string; weights: number[] }[] }) => {
    L.push(`== ${title} ==`);
    L.push(row(["Segmen", ...m.criteria.map((c) => `${c.key} ${c.nama}`)]));
    for (const s of m.segments) L.push(row([s.segment, ...s.weights]));
    L.push("");
  };
  matrix("Bobot Kriteria per Segmen Umur", d.age);
  matrix("Bobot Kriteria per Gender", d.gender);

  L.push("== Top Kota Asal Wisatawan ==");
  L.push(row(["Kota", "Jumlah"]));
  for (const k of d.topKota) L.push(row([k.kota, k.count]));
  L.push("");

  L.push("== Tren Grup & Booking (6 bulan) ==");
  L.push(row(["Bulan", "Grup Dibuat", "Grup Dipesan"]));
  for (const t of d.trend) L.push(row([t.label, t.created, t.booked]));
  L.push("");

  L.push("== Paket Terpilih & Revenue ==");
  L.push(row(["Paket", "Jumlah Grup", "Total Revenue (Rp)"]));
  for (const p of d.pkg) L.push(row([p.nama, p.count, p.revenue]));
  L.push("");

  L.push("== Demografi Gender ==");
  L.push(row(["Gender", "Jumlah"]));
  for (const g of d.demo.gender) L.push(row([g.label, g.count]));
  L.push("");

  L.push("== Demografi Sebaran Umur ==");
  L.push(row(["Rentang Umur", "Jumlah"]));
  for (const b of d.demo.ageBuckets) L.push(row([b.label, b.count]));
  L.push("");

  L.push("== Ringkasan Insight ==");
  for (const s of d.insight) L.push(esc(s));

  return "\uFEFF" + L.join("\n");
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s.user || s.user.role !== "OWNER") return NextResponse.json({ error: "Khusus Owner" }, { status: 403 });
  try {
    const d = await gather();
    if (new URL(req.url).searchParams.get("format") === "csv") {
      return new Response(toCsv(d), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="strategic-bi-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return NextResponse.json(d);
  } catch (e: any) {
    console.error("admin/bi error:", e);
    return NextResponse.json({ error: "Gagal memuat data BI: " + String(e?.message ?? e) }, { status: 500 });
  }
}
