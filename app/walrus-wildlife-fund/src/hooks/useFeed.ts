import { useState, useMemo } from "react";
import { datasets, categories } from "@/lib/mock-data";
import type { Dataset } from "@/lib/types";

export function useFeed() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  const filteredDatasets = useMemo(() => {
    return datasets.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCategory =
        activeCategory === "All" || d.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [search, activeCategory, sortBy]);

  return {
    datasets: filteredDatasets,
    allDatasets: datasets,
    categories,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    isLoading: false,
  };
}

export function useTrendingDatasets(limit = 6): {
  datasets: Dataset[];
  isLoading: boolean;
} {
  return {
    datasets: datasets.slice(0, limit),
    isLoading: false,
  };
}
