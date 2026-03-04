import { useState, useEffect, useMemo } from "react";
import type { Dataset } from "@/lib/types";

export function useFeed() {
  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        setAllDatasets(data.datasets);
        setCategories(data.categories);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
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
    categories,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    isLoading,
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
