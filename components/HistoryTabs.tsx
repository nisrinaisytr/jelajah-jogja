// components/HistoryTabs.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

export interface GroupCard {
  id: number; groupCode: string; groupName: string; status: string;
  durasiTour: number; memberCount: number; finalPackageNama: string | null; hasSubmitted: boolean;
}

function groupHref(status: string, hasSubmitted: boolean, code: string) {
  if (status === "IN_PROGRESS") return hasSubmitted ? `/waiting-room/${code}` : `/survey/${code}`;
  return `/results/${code}`;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: { label: "Berlangsung", cls: "bg-[#FEF3C7] text-[#F59E0B]" },
  COMPLETED: { label: "Selesai", cls: "bg-[#ECFDF5] text-[#10B981]" },
  BOOKED: { label: "Dipesan", cls: "bg-[#E6F4FE] text-[#0194F3]" },
};

function CardList({ groups }: { groups: GroupCard[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
        Belum ada grup di kategori ini.
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((g) => {
        const badge = STATUS_BADGE[g.status] ?? STATUS_BADGE.IN_PROGRESS;
        return (
          <Link key={g.id} href={groupHref(g.status, g.hasSubmitted, g.groupCode)}
            className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-slate-700">{g.groupCode}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
            </div>
            <div className="mt-2 font-bold text-slate-800">{g.groupName}</div>
            <div className="mt-1 text-xs text-slate-500">{g.memberCount} anggota • {g.durasiTour} hari</div>
            {g.finalPackageNama && (
              <div className="mt-2 rounded-lg bg-[#E6F4FE] px-3 py-1.5 text-xs font-semibold text-[#0194F3]">
                ✅ Paket terpilih: {g.finalPackageNama}
              </div>
            )}
            <div className="mt-2 text-xs font-semibold text-[#0194F3]">{g.status === "IN_PROGRESS" && !g.hasSubmitted ? "Lanjutkan kuesioner →" : g.status === "IN_PROGRESS" ? "Lihat progres →" : "Lihat hasil →"}</div>
          </Link>
        );
      })}
    </div>
  );
}

export default function HistoryTabs({ leaderGroups, memberGroups }: { leaderGroups: GroupCard[]; memberGroups: GroupCard[] }) {
  const [tab, setTab] = useState<"leader" | "member">("leader");
  const active = tab === "leader" ? leaderGroups : memberGroups;

  return (
    <div>
      <div className="mb-5 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("leader")}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${tab === "leader" ? "border-[#0194F3] text-[#0194F3]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          👑 Sebagai Leader ({leaderGroups.length})
        </button>
        <button
          onClick={() => setTab("member")}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${tab === "member" ? "border-[#0194F3] text-[#0194F3]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          👤 Sebagai Member ({memberGroups.length})
        </button>
      </div>
      <CardList groups={active} />
    </div>
  );
}
