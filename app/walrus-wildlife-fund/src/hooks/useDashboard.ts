import { useState, useEffect } from "react";
import type { Dataset } from "@/lib/types";
import { useCurrentAccount } from "@mysten/dapp-kit-react";

interface DashboardStat {
  label: string;
  value: string;
  key: string;
}

function toUiDataset(raw: any, fallbackId: string): Dataset {
  const id = String(raw?.id ?? fallbackId);
  const priceMist = Number(raw?.price_sui ?? 0);
  const priceSui = Number.isFinite(priceMist)
    ? (priceMist / 1_000_000_000).toString()
    : "0";

  return {
    id,
    name: String(raw?.name ?? "Untitled Dataset"),
    description: String(raw?.description ?? ""),
    category: String(raw?.project ?? "Other"),
    price: priceSui,
    size: "N/A",
    format: "Encrypted",
    downloads: 0,
    expiresIn: "N/A",
    seller: String(raw?.funds_receiver ?? ""),
    verified: false,
  };
}

export function useDashboard(): {
  publishedDatasets: Dataset[];
  purchasedDatasets: Dataset[];
  stats: DashboardStat[];
  isLoading: boolean;
  error: string | null;
} {
  const account = useCurrentAccount();
  const [publishedDatasets, setPublishedDatasets] = useState<Dataset[]>([]);
  const [purchasedDatasets, setPurchasedDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!account?.address) {
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
          `/api/user/datasets?userId=${encodeURIComponent(account.address)}`,
          { method: "GET" },
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load dashboard datasets.");
        }

        const ownRaw = Array.isArray(data?.own_datasets) ? data.own_datasets : [];
        const readRaw = Array.isArray(data?.read_datasets) ? data.read_datasets : [];
        const ownDatasets = ownRaw.map((d: any, idx: number) =>
          toUiDataset(d, `own-${idx}`),
        );
        const readDatasets = readRaw.map((d: any, idx: number) =>
          toUiDataset(d, `read-${idx}`),
        );

        setPublishedDatasets(ownDatasets);
        setPurchasedDatasets(readDatasets);
        setStats([
          { key: "published", label: "Published", value: String(ownDatasets.length) },
          { key: "purchased", label: "Purchased", value: String(readDatasets.length) },
          { key: "earnings", label: "Total Earnings", value: "0 SUI" },
          { key: "storage", label: "Active Storage", value: "0 GB" },
        ]);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
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
  }, [account?.address]);

  return { publishedDatasets, purchasedDatasets, stats, isLoading, error };
}
