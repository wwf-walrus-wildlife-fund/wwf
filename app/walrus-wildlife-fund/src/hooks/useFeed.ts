import { useState, useEffect, useMemo } from "react";
import type { Dataset, Stat } from "@/lib/types";

interface FeedData {
  datasets: Dataset[];
  categories: string[];
}

let feedCache: FeedData | null = null;
let feedPromise: Promise<FeedData> | null = null;

function fetchFeedOnce(): Promise<FeedData> {
  if (feedCache) return Promise.resolve(feedCache);
  if (feedPromise) return feedPromise;

  feedPromise = fetch("/api/feed")
    .then(async (res) => {
      if (!res.ok) throw new Error(`Feed request failed (${res.status})`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      const datasets = (data?.datasets ?? data?.feed ?? []) as Dataset[];
      const apiCategories = Array.isArray(data?.categories)
        ? (data.categories as string[])
        : [];
      const derived = Array.from(
        new Set(
          (Array.isArray(datasets) ? datasets : [])
            .map((d) => d?.category)
            .filter((c): c is string => typeof c === "string" && c.length > 0),
        ),
      );
      const categories = Array.from(new Set(["All", ...apiCategories, ...derived]));
      const result = { datasets: Array.isArray(datasets) ? datasets : [], categories };
      feedCache = result;
      return result;
    })
    .catch((err) => {
      feedPromise = null;
      throw err;
    });

  return feedPromise;
}

export function useFeed() {
  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    fetchFeedOnce()
      .then(({ datasets, categories }) => {
        setAllDatasets(datasets);
        setCategories(categories);
        setError(null);
      })
      .catch((err) => {
        setAllDatasets([]);
        setCategories(["All"]);
        setError(err instanceof Error ? err.message : "Failed to fetch feed");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredDatasets = useMemo(() => {
    let result = allDatasets.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === "All" || d.category === activeCategory;
      return matchSearch && matchCategory;
    });

    switch (sortBy) {
      case "newest":
        result = [...result].reverse();
        break;
      case "price-low":
        result = [...result].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        result = [...result].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
    }

    return result;
  }, [allDatasets, search, activeCategory, sortBy]);

  return {
    datasets: filteredDatasets,
    allDatasets,
    isFeedEmpty: !isLoading && allDatasets.length === 0,
    categories,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    isLoading,
    error,
  };
}

export function useTrendingDatasets(limit = 6): {
  datasets: Dataset[];
  isLoading: boolean;
} {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeedOnce()
      .then(({ datasets }) => setDatasets(datasets.slice(0, limit)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { datasets, isLoading };
}

export function useStats(): { stats: Stat[]; isLoading: boolean } {
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading };
}
