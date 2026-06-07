// app/api/admin/scores/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
async function guard() { const s = await getSession(); const u = s.user; return u && (u.role === "OWNER" || u.role === "STAFF") ? u : null; }

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("destinationId"));
  if (!id) return NextResponse.json({ error: "destinationId wajib" }, { status: 400 });
  const scores = await prisma.destinationScore.findMany({ where: { destinationId: id }, select: { kriteriaKey: true, subCriteriaKey: true, scoreValue: true } });
  return NextResponse.json({ scores });
}

const schema = z.object({
  destinationId: z.coerce.number().int(),
  scores: z.array(z.object({ kriteriaKey: z.string(), subCriteriaKey: z.string(), scoreValue: z.coerce.number().int().min(1).max(5) })),
});

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const { destinationId, scores } = p.data;
  await prisma.$transaction([
    prisma.destinationScore.deleteMany({ where: { destinationId } }),
    prisma.destinationScore.createMany({ data: scores.map((s) => ({ destinationId, kriteriaKey: s.kriteriaKey, subCriteriaKey: s.subCriteriaKey, scoreValue: s.scoreValue })) }),
  ]);
  return NextResponse.json({ ok: true, saved: scores.length });
}
