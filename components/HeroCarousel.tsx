// components/HeroCarousel.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DestImage from "@/components/DestImage";
import { formatRupiah } from "@/lib/destinasi-helpers";

interface D {
  id: number; nama: string; wilayah: string; jarakPusat: number;
  rating: number; hargaTiket: number; imageUrl: string; kategori: string;
}

export default function HeroCarousel({ destinations }: { destinations: D[] }) {
  const items = destinations.slice(0, 3); // maksimal 3
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items.length, paused]);

  if (!items.length) return null;
  const d = items[i];

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Link
        href={`/eksplorasi/${d.id}`}
        className="block rotate-2 transform rounded-3xl bg-white p-4 shadow-2xl transition duration-300 hover:rotate-0"
      >
        <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl">
          <DestImage src={d.imageUrl} alt={d.nama} kategori={d.kategori} className="h-full w-full" />
          <div className="absolute left-2 top-2 rounded-full bg-[#FF5E1F] px-2.5 py-0.5 text-[10px] font-bold text-white">
            {d.kategori}
          </div>
        </div>
        <div className="font-bold text-slate-900">{d.nama}</div>
        <div className="mb-2 text-xs text-slate-500">📍 {d.wilayah} • {d.jarakPusat} km</div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-[#10B981]">★ {d.rating}</div>
          <div className="font-bold text-[#FF5E1F]">{formatRupiah(d.hargaTiket)}</div>
        </div>
      </Link>

      {/* Dots — klik untuk geser */}
      <div className="mt-4 flex justify-center gap-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Tampilkan destinasi ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}
