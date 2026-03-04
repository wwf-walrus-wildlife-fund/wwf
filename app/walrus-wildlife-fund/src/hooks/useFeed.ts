import { useState, useEffect, useMemo } from "react";
import type { Dataset } from "@/lib/types";

export function useFeed() {
  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed");
        if (!res.ok) {
          throw new Error(`Feed request failed (${res.status})`);
        }

        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        const datasets = (data?.datasets ?? data?.feed ?? []) as Dataset[];

        setAllDatasets(Array.isArray(datasets) ? datasets : []);

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
        const nextCategories = Array.from(
          new Set(["All", ...apiCategories, ...derived]),
        );
        setCategories(nextCategories);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
        setAllDatasets([]);
        setCategories(["All"]);
        setError(err instanceof Error ? err.message : "Failed to fetch feed");
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeed();
  }, []);

  const filteredDatasets = useMemo(() => {
    return allDatasets.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === "All" || d.category === activeCategory;
      return matchSearch && matchCategory;
    });
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
    async function fetchTrending() {
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        setDatasets(data.datasets.slice(0, limit));
      } catch (err) {
        console.error("Failed to fetch trending datasets:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrending();
  }, [limit]);

  return { datasets, isLoading };
}
