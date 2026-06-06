// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jelajah Jogja",
  description: "Sistem Pendukung Keputusan Wisata Yogyakarta — BWM-TOPSIS Kolaboratif",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${jakarta.className} antialiased`}>{children}</body>
    </html>
  );
}
