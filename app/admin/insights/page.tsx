// app/admin/insights/page.tsx
import { getMostPopularDestinations, getKategoriDistribution, getLowPerformers, getDurasiDistribution } from "@/lib/analytics-engine";
import InsightsView from "@/components/admin/InsightsView";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [popular, kategori, low, durasi] = await Promise.all([
    getMostPopularDestinations(10),
    getKategoriDistribution(),
    getLowPerformers(8),
    getDurasiDistribution(),
  ]);
  return <InsightsView popular={popular} kategori={kategori} low={low} durasi={durasi} />;
}
