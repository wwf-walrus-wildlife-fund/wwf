"use client";

import { Search, Grid3X3, List } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { GlowOrb } from "@/components/glow-orb";
import { DatasetCard } from "@/components/dataset-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useFeed } from "@/hooks/useFeed";

export default function MarketplacePage() {
  const {
    datasets: filteredDatasets,
    categories,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
  } = useFeed();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative min-h-screen pt-24 pb-16 px-4">
        <GlowOrb color="indigo" size="400px" top="0" right="-100px" opacity={0.06} />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-white mb-2" style={{ fontSize: "2rem" }}>
              Marketplace
            </h1>
            <p className="text-white/30">
              Browse, buy, or rent data from verified providers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Search datasets, tags, or providers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-[#6C5CE7]/30 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 focus:outline-none focus:border-[#6C5CE7]/30 appearance-none cursor-pointer"
                  style={{ fontSize: "0.85rem" }}
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <div className="hidden sm:flex items-center rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-3 transition-colors ${
                      viewMode === "grid"
                        ? "text-[#C4B5FD] bg-[#4834D4]/10"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-3 transition-colors ${
                      viewMode === "list"
                        ? "text-[#C4B5FD] bg-[#4834D4]/10"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-[#4834D4]/15 text-[#C4B5FD] border border-[#4834D4]/25"
                      : "bg-white/[0.03] text-white/30 border border-white/[0.05] hover:bg-white/[0.06] hover:text-white/50"
                  }`}
                  style={{ fontSize: "0.8rem" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="mb-6 text-white/20" style={{ fontSize: "0.8rem" }}>
            {filteredDatasets.length} dataset
            {filteredDatasets.length !== 1 ? "s" : ""} found
          </div>

          <div
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredDatasets.map((dataset, i) => (
              <motion.div
                key={dataset.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <DatasetCard dataset={dataset} />
              </motion.div>
            ))}
          </div>

          {filteredDatasets.length === 0 && (
            <div className="text-center py-20">
              <div className="text-white/10 mb-4" style={{ fontSize: "3rem" }}>
                :/
              </div>
              <p className="text-white/30">No datasets match your search.</p>
              <p
                className="text-white/15 mt-1"
                style={{ fontSize: "0.85rem" }}
              >
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
