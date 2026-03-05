import { useState, useEffect, useCallback } from "react";
import type { Dataset } from "@/lib/types";
import { toUiDataset } from "@/lib/sui-helpers";
import { useCurrentAccount } from "@mysten/dapp-kit-react";

interface DashboardStat {
  label: string;
  value: string;
  key: string;
}

export function useDashboard(targetAddress?: string): {
  publishedDatasets: Dataset[];
  purchasedDatasets: Dataset[];
  stats: DashboardStat[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const account = useCurrentAccount();
  const [publishedDatasets, setPublishedDatasets] = useState<Dataset[]>([]);
  const [purchasedDatasets, setPurchasedDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchDashboard() {
      const address = targetAddress ?? account?.address;
      if (!address) {
        setPublishedDatasets([]);
        setPurchasedDatasets([]);
        setStats([
          { key: "published", label: "Published", value: "0" },
          { key: "purchased", label: "Purchased", value: "0" },
          { key: "earnings", label: "Total Earnings", value: "0 SUI" },
          { key: "storage", label: "Active Storage", value: "0 GB" },
        ]);
        setError("Connect your wallet to load your dashboard.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/user/${encodeURIComponent(address)}`,
          { method: "GET" },
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load dashboard datasets.");
        }

        const ownRaw = Array.isArray(data?.own_datasets) ? data.own_datasets : [];
        const readRaw = Array.isArray(data?.read_datasets) ? data.read_datasets : [];
        const ownDatasets = ownRaw
          .map((d: any) => toUiDataset(String(d?.id ?? ""), d))
          .filter((d: Dataset) => !d.archived);
        const readDatasets = readRaw
          .map((d: any) => toUiDataset(String(d?.id ?? ""), d))
          .filter((d: Dataset) => !d.archived);

        setPublishedDatasets(ownDatasets);
        setPurchasedDatasets(readDatasets);
        setStats([
          { key: "published", label: "Published", value: String(ownDatasets.length) },
          { key: "purchased", label: "Purchased", value: String(readDatasets.length) },
          { key: "earnings", label: "Total Earnings", value: "0 SUI" },
          { key: "storage", label: "Active Storage", value: "0 GB" },
        ]);
      } catch (err) {
        setPublishedDatasets([]);
        setPurchasedDatasets([]);
        setStats([
          { key: "published", label: "Published", value: "0" },
          { key: "purchased", label: "Purchased", value: "0" },
          { key: "earnings", label: "Total Earnings", value: "0 SUI" },
          { key: "storage", label: "Active Storage", value: "0 GB" },
        ]);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard datasets.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [account?.address, targetAddress, fetchKey]);

  return { publishedDatasets, purchasedDatasets, stats, isLoading, error, refetch };
}
