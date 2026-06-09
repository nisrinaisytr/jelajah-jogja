// app/api/group/create/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateGroupCode } from "@/lib/generate-code";
import { getCriteriaTree, MIN_OPSIONAL } from "@/lib/criteria-store";

export const dynamic = "force-dynamic";

const schema = z.object({
  groupName: z.string().min(1, "Nama grup wajib diisi").max(100),
  totalQuota: z.coerce.number().int().min(2, "Kuota minimal 2 orang"),
  durasiTour: z.coerce.number().int().refine((v) => [1, 2, 3].includes(v), "Durasi tidak valid"),
  activeCriteria: z.array(z.string()).min(1),
});

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 15; i++) {
    const code = generateGroupCode();
    const exist = await prisma.group.findUnique({ where: { groupCode: code } });
    if (!exist) return code;
  }
  throw new Error("Gagal menghasilkan kode unik");
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    const { groupName, totalQuota, durasiTour, activeCriteria } = parsed.data;

    // Validasi kriteria berdasarkan data terkini di DB
    const tree = await getCriteriaTree();
    const validKeys = tree.map((c) => c.key);
    const wajibKeys = tree.filter((c) => c.wajib).map((c) => c.key);
    const uniqKeys = Array.from(new Set(activeCriteria));
    if (uniqKeys.some((k) => !validKeys.includes(k))) return NextResponse.json({ error: "Ada kriteria tidak valid" }, { status: 400 });
    if (!wajibKeys.every((k) => uniqKeys.includes(k))) return NextResponse.json({ error: "Kriteria wajib harus disertakan" }, { status: 400 });
    if (uniqKeys.length - wajibKeys.length < MIN_OPSIONAL) return NextResponse.json({ error: `Minimal ${MIN_OPSIONAL} kriteria opsional` }, { status: 400 });

    const userId = session.user.id;
    const groupCode = await uniqueCode();
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: { groupCode, groupName, totalQuota, durasiTour, activeCriteria: JSON.stringify(uniqKeys), leaderId: userId, status: "IN_PROGRESS" },
      });
      await tx.groupMember.create({ data: { groupId: g.id, userId, hasSubmitted: false } });
      return g;
    });
    return NextResponse.json({ ok: true, groupCode: group.groupCode });
  } catch (e) {
    console.error("group/create error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
