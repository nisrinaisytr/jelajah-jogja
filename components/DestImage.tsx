// components/DestImage.tsx
"use client";
import { useState } from "react";
import { kategoriEmoji, kategoriGradient } from "@/lib/destinasi-helpers";

export default function DestImage({
  src,
  alt,
  kategori,
  className = "",
}: {
  src: string;
  alt: string;
  kategori: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${kategoriGradient(kategori)} ${className}`}
      >
        <span className="text-6xl">{kategoriEmoji(kategori)}</span>
      </div>
    );
  }

  // pakai <img> biasa (foto lokal di /public) + fallback otomatis kalau file tidak ada
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={`object-cover ${className}`}
    />
  );
}
