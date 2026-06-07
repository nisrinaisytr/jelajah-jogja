// components/EksplorasiClient.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DestImage from "@/components/DestImage";
import {
  formatRupiah, KATEGORI_LIST, WILAYAH_LIST, RATING_OPTIONS, HARGA_BANDS,
} from "@/lib/destinasi-helpers";

interface Dest {
  id: number; nama: string; kategori: string; wilayah: string;
  hargaTiket: number; rating: number; imageUrl: string; jarakPusat: number;
}

export default function EksplorasiClient() {
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [wilayah, setWilayah] = useState<string[]>([]);
  const [harga, setHarga] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [aksesBus, setAksesBus] = useState(false);
  const [bolehDrone, setBolehDrone] = useState(false);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Dest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (kategori !== "Semua") params.set("kategori", kategori);
    if (wilayah.length) params.set("wilayah", wilayah.join(","));
    if (harga.length) params.set("harga", harga.join(","));
    if (rating) params.set("rating", String(rating));
    if (aksesBus) params.set("aksesBus", "1");
    if (bolehDrone) params.set("bolehDrone", "1");
    params.set("page", String(page));
    const res = await fetch(`/api/destinations?${params.toString()}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [search, kategori, wilayah, harga, rating, aksesBus, bolehDrone, page]);

  // reset ke page 1 saat filter berubah
  useEffect(() => { setPage(1); }, [search, kategori, wilayah, harga, rating, aksesBus, bolehDrone]);
  // debounce fetch
  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  function resetFilter() {
    setSearch(""); setKategori("Semua"); setWilayah([]); setHarga([]);
    setRating(0); setAksesBus(false); setBolehDrone(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Eksplorasi Wisata Yogyakarta</h1>
        <p className="mt-1 text-sm text-slate-500">Temukan dan saring destinasi wisata sesuai preferensimu.</p>

        {/* Pil kategori */}
        <div className="mt-5 flex flex-wrap gap-2">
          {["Semua", ...KATEGORI_LIST].map((k) => (
            <button
              key={k}
              onClick={() => setKategori(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                kategori === k ? "bg-[#0194F3] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
          {/* FILTER PANEL */}
          <aside className="h-fit md:sticky md:top-20">
            <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Filter</h3>
                <button onClick={resetFilter} className="text-xs font-semibold text-[#0194F3] hover:underline">Reset</button>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama wisata..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0194F3]"
              />

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">Wilayah</p>
                <div className="space-y-1.5">
                  {WILAYAH_LIST.map((w) => (
                    <label key={w} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={wilayah.includes(w)} onChange={() => toggle(wilayah, w, setWilayah)} className="accent-[#0194F3]" />
                      {w}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">Harga Tiket</p>
                <div className="space-y-1.5">
                  {HARGA_BANDS.map((b) => (
                    <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={harga.includes(b.id)} onChange={() => toggle(harga, b.id, setHarga)} className="accent-[#0194F3]" />
                      {b.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">Rating Minimal</p>
                <div className="flex gap-2">
                  {RATING_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRating(rating === r.value ? 0 : r.value)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${rating === r.value ? "bg-[#10B981] text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      ⭐ {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">Logistik & Akses</p>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={aksesBus} onChange={(e) => setAksesBus(e.target.checked)} className="accent-[#0194F3]" />
                  🚌 Akses Bus
                </label>
                <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={bolehDrone} onChange={(e) => setBolehDrone(e.target.checked)} className="accent-[#0194F3]" />
                  🚁 Boleh Drone
                </label>
              </div>
            </div>
          </aside>

          {/* GRID */}
          <div>
            <p className="mb-3 text-sm text-slate-500">{loading ? "Memuat..." : `${total} destinasi ditemukan`}</p>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
                Tidak ada destinasi yang cocok. Coba ubah filter.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((d) => (
                  <Link key={d.id} href={`/eksplorasi/${d.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <DestImage src={d.imageUrl} alt={d.nama} kategori={d.kategori} className="h-full w-full" />
                      <div className="absolute left-2 top-2 rounded-full bg-[#FF5E1F] px-2.5 py-0.5 text-[10px] font-bold text-white">{d.kategori}</div>
                      <div className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-0.5 text-[10px] font-bold">⭐ {d.rating}</div>
                    </div>
                    <div className="p-4">
                      <div className="mb-1 text-sm font-bold text-slate-900">{d.nama}</div>
                      <div className="mb-2 text-[10px] text-slate-500">📍 {d.wilayah} • {d.jarakPusat} km</div>
                      <div className="text-sm font-bold text-[#FF5E1F]">{formatRupiah(d.hargaTiket)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-40">← Sebelumnya</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold ${page === i + 1 ? "bg-[#0194F3] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Berikutnya →</button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
