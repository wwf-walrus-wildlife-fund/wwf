import { datasets } from "@/lib/mock-data";
import type { Dataset } from "@/lib/types";

interface DashboardStat {
  label: string;
  value: string;
  key: string;
}

export function useDashboard(): {
  publishedDatasets: Dataset[];
  purchasedDatasets: Dataset[];
  stats: DashboardStat[];
  isLoading: boolean;
} {
  const publishedDatasets = datasets.slice(0, 4);
  const purchasedDatasets = datasets.slice(4, 7);

  const stats: DashboardStat[] = [
    { key: "published", label: "Published", value: "4" },
    { key: "purchased", label: "Purchased", value: "3" },
    { key: "earnings", label: "Total Earnings", value: "847 SUI" },
    { key: "storage", label: "Active Storage", value: "72.3 GB" },
  ];

  return {
    publishedDatasets,
    purchasedDatasets,
    stats,
    isLoading: false,
  };
}
