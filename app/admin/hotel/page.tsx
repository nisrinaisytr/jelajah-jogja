// app/admin/hotel/page.tsx
import MasterCrud, { type Field, type Column, type Filter } from "@/components/admin/MasterCrud";

export const dynamic = "force-dynamic";
const WILAYAH = ["Kota", "Sleman", "Bantul", "Gunungkidul", "Kulon Progo", "Magelang"];

const columns: Column[] = [
  { key: "nama", label: "Nama" },
  { key: "wilayah", label: "Wilayah" },
  { key: "tier", label: "Tier", format: "badge" },
  { key: "hargaPerMalam", label: "Harga/Malam", format: "rupiah" },
  { key: "rating", label: "Rating", format: "rating" },
];
const fields: Field[] = [
  { name: "nama", label: "Nama Hotel", type: "text", required: true, full: true },
  { name: "tier", label: "Tier", type: "select", options: ["BUDGET", "STANDARD", "PREMIUM"], required: true },
  { name: "wilayah", label: "Wilayah", type: "select", options: WILAYAH, required: true },
  { name: "hargaPerMalam", label: "Harga / Malam (Rp)", type: "number", required: true },
  { name: "rating", label: "Rating (0-5)", type: "number", step: "0.1", required: true },
  { name: "latitude", label: "Latitude", type: "number", step: "any", required: true },
  { name: "longitude", label: "Longitude", type: "number", step: "any", required: true },
  { name: "alamat", label: "Alamat", type: "textarea", required: true },
  { name: "fasilitas", label: "Fasilitas", type: "text", placeholder: "WiFi, AC, Sarapan, Kolam", help: "Pisahkan dengan koma", full: true },
  { name: "imageUrl", label: "URL Gambar", type: "text", placeholder: "/images/lodging/nama.jpg", full: true },
];
const filters: Filter[] = [{ name: "tier", label: "Tier", options: ["BUDGET", "STANDARD", "PREMIUM"] }];

export default function HotelPage() {
  return <MasterCrud title="Master Hotel" icon="🏨" endpoint="/api/admin/hotels" desc="Kelola data hotel untuk auto-generate paket wisata."
    columns={columns} fields={fields} filters={filters} searchKeys={["nama", "alamat"]} />;
}
