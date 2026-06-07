// app/admin/product/page.tsx
import { CRITERIA_MASTER } from "@/lib/criteria-master";
import ProductManager from "@/components/admin/ProductManager";

export const dynamic = "force-dynamic";

export default function ProductPage() {
  const criteria = CRITERIA_MASTER.map((c) => ({ key: c.key, nama: c.nama, wajib: c.wajib, subKriteria: c.subKriteria.map((s) => ({ key: s.key, nama: s.nama })) }));
  return <ProductManager criteria={criteria} />;
}
