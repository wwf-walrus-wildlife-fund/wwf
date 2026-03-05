"use client";

import { useState } from "react";
import {
  Upload,
  Download,
  TrendingUp,
  Database,
  Clock,
  ExternalLink,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { GlowOrb } from "@/components/glow-orb";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FindUserForm } from "@/components/find-user-form";
import { useDashboard } from "@/hooks/useDashboard";
import { useArchiveAndDeleteDataset } from "@/hooks/useArchiveAndDeleteDataset";
import Link from "next/link";

const statIcons: Record<string, typeof Upload> = {
  published: Upload,
  purchased: Download,
  earnings: TrendingUp,
  storage: Database,
};

const statColors: Record<string, string> = {
  published: "text-[#a29bfe]",
  purchased: "text-[#65C8D0]",
  earnings: "text-emerald-400",
  storage: "text-[#C4B5FD]",
};

interface DashboardViewProps {
  address?: string;
}

export function DashboardView({ address }: DashboardViewProps) {
  const { publishedDatasets, purchasedDatasets, stats, isLoading, error, refetch } =
    useDashboard(address);
  const { archiveAndDelete, isPending } = useArchiveAndDeleteDataset();
  const [activeTab, setActiveTab] = useState<"published" | "purchased">(
    "published",
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeDatasets =
    activeTab === "published" ? publishedDatasets : purchasedDatasets;

  async function handleDelete(datasetId: string, blobObjectIds: string[]) {
    if (!confirm("Delete the Walrus blob(s) for this dataset? This cannot be undone.")) return;
    setDeletingId(datasetId);
    try {
      const ok = await archiveAndDelete(datasetId, blobObjectIds);
      if (ok) refetch();
    } finally {
      setDeletingId(null);
    }
  }

  const subtitle = address
    ? `Showing datasets for: ${address}`
    : "Manage your datasets and track performance.";

  return (
    <div className="min-h-screen bg-background retro-shell">
      <Navbar />
      <div className="relative min-h-screen pt-24 pb-16 px-6 lg:px-10">
        <GlowOrb color="cyan" size="400px" top="0" left="-100px" opacity={0.04} />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-[#8ef8f7] mb-2" style={{ fontSize: "2rem" }}>
              Dashboard
            </h1>
            <p className="retro-muted break-all">{subtitle}</p>
          </motion.div>

          <FindUserForm initialAddress={address} />

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat) => {
              const Icon = statIcons[stat.key] || Database;
              const color = statColors[stat.key] || "text-white/60";
              return (
                <div
                  key={stat.key}
                  className="p-5 retro-panel transition-colors"
                >
                  <Icon className={`w-5 h-5 ${color} opacity-60 mb-3`} />
                  <p
                    className="text-[#ffe066] mb-0.5"
                    style={{ fontSize: "1.5rem" }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-[#85a3c7]"
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </motion.div>

          {/* Earnings graph placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 retro-panel mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#8ef8f7]">Earnings Overview</h3>
              <div className="flex gap-2">
                {["7D", "30D", "90D"].map((range) => (
                  <button
                    key={range}
                    className="px-3 py-1 border-2 border-[#466aa8] text-[#8ef8f7] bg-[#1b2a4f] hover:text-[#ffe066] hover:border-[#ffe066] transition-all"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 flex items-end gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const h = ((Math.sin(i * 0.5) + 1) / 2) * 80 + 20;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-[#ff4d9e]/60 to-[#8ef8f7]/20 hover:from-[#ffe066]/60 hover:to-[#8ef8f7]/25 transition-colors cursor-pointer"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
            <div
              className="flex justify-between mt-3 text-white/10"
              style={{ fontSize: "0.65rem" }}
            >
              <span>Mar 3</span>
              <span>Today</span>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-1 mb-6 p-1 border-2 border-[#466aa8] bg-[#1b2a4f] inline-flex">
              <button
                onClick={() => setActiveTab("published")}
                className={`px-5 py-2 border-2 transition-all ${
                  activeTab === "published"
                    ? "bg-[#ff4d9e] text-[#0a1020] border-[#ffe066]"
                    : "text-[#8ef8f7] bg-[#1b2a4f] border-[#466aa8] hover:text-[#ffe066] hover:border-[#ffe066]"
                }`}
                style={{ fontSize: "0.85rem" }}
              >
                Published ({publishedDatasets.length})
              </button>
              <button
                onClick={() => setActiveTab("purchased")}
                className={`px-5 py-2 border-2 transition-all ${
                  activeTab === "purchased"
                    ? "bg-[#ff4d9e] text-[#0a1020] border-[#ffe066]"
                    : "text-[#8ef8f7] bg-[#1b2a4f] border-[#466aa8] hover:text-[#ffe066] hover:border-[#ffe066]"
                }`}
                style={{ fontSize: "0.85rem" }}
              >
                Purchased ({purchasedDatasets.length})
              </button>
            </div>

            {/* Table */}
            <div className="retro-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {["Dataset", "Category", "Size", activeTab === "published" ? "Earnings" : "Price", "Expires", ""].map(
                        (header, idx) => (
                          <th
                            key={header || idx}
                            className={`text-left px-6 py-4 text-white/20 ${
                              idx === 1 ? "hidden sm:table-cell" : ""
                            } ${idx === 2 ? "hidden md:table-cell" : ""} ${
                              idx === 4 ? "hidden lg:table-cell" : ""
                            }`}
                            style={{
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-white/40"
                          style={{ fontSize: "0.9rem" }}
                        >
                          Loading datasets...
                        </td>
                      </tr>
                    )}

                    {!isLoading && error && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-rose-300/80"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {error}
                        </td>
                      </tr>
                    )}

                    {!isLoading && !error && activeDatasets.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-white/35"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {activeTab === "published"
                            ? address
                              ? "This user doesn't own any dataset yet."
                              : "You don't own any dataset yet."
                            : address
                              ? "This user hasn't purchased any dataset yet."
                              : "You haven't purchased any dataset yet."}
                        </td>
                      </tr>
                    )}

                    {!isLoading &&
                      !error &&
                      activeDatasets.map((d, i) => (
                        <motion.tr
                          key={d.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <p
                              className="text-white/70 group-hover:text-white transition-colors"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {d.name}
                            </p>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <span
                              className="px-2 py-0.5 rounded bg-white/[0.04] text-white/25"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {d.category}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 hidden md:table-cell text-white/30"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {d.size}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="text-[#C4B5FD]"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {d.price}
                            </span>
                            <span
                              className="text-white/15 ml-1"
                              style={{ fontSize: "0.7rem" }}
                            >
                              SUI
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <span
                              className="flex items-center gap-1 text-white/20"
                              style={{ fontSize: "0.8rem" }}
                            >
                              <Clock className="w-3 h-3" /> {d.expiresIn}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Link href={`/dataset/${encodeURIComponent(d.id)}`} className="p-2 rounded-lg text-white/15 hover:text-white/40 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100">
                                {activeTab === "published" ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <ExternalLink className="w-4 h-4" />
                                )}
                              </Link>
                              {activeTab === "published" && d.blobObjectIds && d.blobObjectIds.length > 0 && (
                                <button
                                  onClick={() => handleDelete(d.id, d.blobObjectIds!)}
                                  disabled={isPending && deletingId === d.id}
                                  className="p-2 rounded-lg text-white/15 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                  title="Delete Walrus blob"
                                >
                                  {isPending && deletingId === d.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
