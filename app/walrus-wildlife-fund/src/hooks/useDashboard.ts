import { useState, useEffect } from "react";
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
  const [publishedDatasets, setPublishedDatasets] = useState<Dataset[]>([]);
  const [purchasedDatasets, setPurchasedDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();
        setPublishedDatasets(data.publishedDatasets);
        setPurchasedDatasets(data.purchasedDatasets);
        setStats(data.stats);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  return { publishedDatasets, purchasedDatasets, stats, isLoading };
}
