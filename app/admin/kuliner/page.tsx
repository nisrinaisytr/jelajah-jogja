// app/admin/kuliner/page.tsx
import MasterCrud, { type Field, type Column } from "@/components/admin/MasterCrud";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "nama", label: "Nama" },
  { key: "jenis", label: "Jenis", format: "badge" },
  { key: "alamat", label: "Alamat" },
  { key: "hargaRataRata", label: "Harga Rata2", format: "rupiah" },
  { key: "rating", label: "Rating", format: "rating" },
];
const fields: Field[] = [
  { name: "nama", label: "Nama Tempat", type: "text", required: true, full: true },
  { name: "jenis", label: "Jenis (Gudeg, Sate, Kopi, dll)", type: "text", required: true },
  { name: "hargaRataRata", label: "Harga Rata-rata / Porsi (Rp)", type: "number", required: true },
  { name: "rating", label: "Rating (0-5)", type: "number", step: "0.1", required: true },
  { name: "latitude", label: "Latitude", type: "number", step: "any", required: true },
  { name: "longitude", label: "Longitude", type: "number", step: "any", required: true },
  { name: "alamat", label: "Alamat", type: "textarea", required: true },
  { name: "imageUrl", label: "URL Gambar", type: "text", placeholder: "/images/kuliner/nama.jpg", full: true },
];

export default function KulinerPage() {
  return <MasterCrud title="Master Kuliner" icon="🍗" endpoint="/api/admin/kuliner" desc="Kelola data kuliner untuk rekomendasi di paket."
    columns={columns} fields={fields} searchKeys={["nama", "jenis", "alamat"]} />;
}
