// app/api/group/create/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateGroupCode } from "@/lib/generate-code";
import { CRITERIA_MASTER, WAJIB_CRITERIA, MIN_OPSIONAL } from "@/lib/criteria-master";

const VALID_KEYS = CRITERIA_MASTER.map((c) => c.key);

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
    if (!session.user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const { groupName, totalQuota, durasiTour, activeCriteria } = parsed.data;

    // Validasi kriteria: semua key valid, wajib (K2,K3,K8) harus ada, total 5-8
    const uniqKeys = Array.from(new Set(activeCriteria));
    if (uniqKeys.some((k) => !VALID_KEYS.includes(k))) {
      return NextResponse.json({ error: "Ada kriteria tidak valid" }, { status: 400 });
    }
    if (!WAJIB_CRITERIA.every((k) => uniqKeys.includes(k))) {
      return NextResponse.json({ error: "Kriteria wajib (K2, K3, K8) harus disertakan" }, { status: 400 });
    }
    const opsionalCount = uniqKeys.length - WAJIB_CRITERIA.length;
    if (opsionalCount < MIN_OPSIONAL) {
      return NextResponse.json({ error: `Minimal ${MIN_OPSIONAL} kriteria opsional` }, { status: 400 });
    }

    const userId = session.user.id;
    const groupCode = await uniqueCode();

    // Buat grup + leader auto-join sebagai GroupMember (role User tetap MEMBER; leadership via leaderId)
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          groupCode,
          groupName,
          totalQuota,
          durasiTour,
          activeCriteria: JSON.stringify(uniqKeys),
          leaderId: userId,
          status: "IN_PROGRESS",
        },
      });
      await tx.groupMember.create({
        data: { groupId: g.id, userId, hasSubmitted: false },
      });
      return g;
    });

    return NextResponse.json({ ok: true, groupCode: group.groupCode });
  } catch (e) {
    console.error("group/create error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
