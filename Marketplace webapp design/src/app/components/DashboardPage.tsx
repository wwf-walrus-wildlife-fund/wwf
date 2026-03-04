import { useState } from "react";
import { Upload, Download, TrendingUp, Database, Clock, ExternalLink, Eye } from "lucide-react";
import { motion } from "motion/react";
import { GlowOrb } from "./GlowOrb";
import { datasets } from "./mockData";

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"published" | "purchased">("published");

  const publishedDatasets = datasets.slice(0, 4);
  const purchasedDatasets = datasets.slice(4, 7);

  const dashStats = [
    { label: "Published", value: "4", icon: Upload, color: "text-[#a29bfe]" },
    { label: "Purchased", value: "3", icon: Download, color: "text-[#65C8D0]" },
    { label: "Total Earnings", value: "847 SUI", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Active Storage", value: "72.3 GB", icon: Database, color: "text-[#C4B5FD]" },
  ];

  const activeDatasets = activeTab === "published" ? publishedDatasets : purchasedDatasets;

  return (
    <div className="relative min-h-screen pt-24 pb-16 px-4">
      <GlowOrb color="cyan" size="400px" top="0" left="-100px" opacity={0.04} />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-white mb-2" style={{ fontSize: "2rem" }}>Dashboard</h1>
          <p className="text-white/30">Manage your datasets and track performance.</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {dashStats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-60 mb-3`} />
              <p className="text-white mb-0.5" style={{ fontSize: "1.5rem" }}>{stat.value}</p>
              <p className="text-white/20" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Earnings graph placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/60">Earnings Overview</h3>
            <div className="flex gap-2">
              {["7D", "30D", "90D"].map((range) => (
                <button
                  key={range}
                  className="px-3 py-1 rounded-md text-white/20 hover:text-white/40 hover:bg-white/5 transition-all"
                  style={{ fontSize: "0.75rem" }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48 flex items-end gap-1">
            {Array.from({ length: 30 }, (_, i) => {
              const h = Math.random() * 100 + 20;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-[#4834D4]/40 to-[#4834D4]/10 hover:from-[#6C5CE7]/50 hover:to-[#6C5CE7]/15 transition-colors cursor-pointer"
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-3 text-white/10" style={{ fontSize: "0.65rem" }}>
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
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] inline-flex">
            <button
              onClick={() => setActiveTab("published")}
              className={`px-5 py-2 rounded-md transition-all ${
                activeTab === "published" ? "bg-[#4834D4]/15 text-[#C4B5FD]" : "text-white/30 hover:text-white/50"
              }`}
              style={{ fontSize: "0.85rem" }}
            >
              Published ({publishedDatasets.length})
            </button>
            <button
              onClick={() => setActiveTab("purchased")}
              className={`px-5 py-2 rounded-md transition-all ${
                activeTab === "purchased" ? "bg-[#4834D4]/15 text-[#C4B5FD]" : "text-white/30 hover:text-white/50"
              }`}
              style={{ fontSize: "0.85rem" }}
            >
              Purchased ({purchasedDatasets.length})
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-6 py-4 text-white/20" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Dataset
                    </th>
                    <th className="text-left px-6 py-4 text-white/20 hidden sm:table-cell" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Category
                    </th>
                    <th className="text-left px-6 py-4 text-white/20 hidden md:table-cell" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Size
                    </th>
                    <th className="text-left px-6 py-4 text-white/20" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {activeTab === "published" ? "Earnings" : "Price"}
                    </th>
                    <th className="text-left px-6 py-4 text-white/20 hidden lg:table-cell" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Expires
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {activeDatasets.map((d, i) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-white/70 group-hover:text-white transition-colors" style={{ fontSize: "0.9rem" }}>
                          {d.name}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-white/25" style={{ fontSize: "0.7rem" }}>
                          {d.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-white/30" style={{ fontSize: "0.85rem" }}>
                        {d.size}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#C4B5FD]" style={{ fontSize: "0.9rem" }}>
                          {activeTab === "published" ? `${(Math.random() * 200 + 50).toFixed(0)}` : d.price}
                        </span>
                        <span className="text-white/15 ml-1" style={{ fontSize: "0.7rem" }}>SUI</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-white/20" style={{ fontSize: "0.8rem" }}>
                          <Clock className="w-3 h-3" /> {d.expiresIn}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 rounded-lg text-white/15 hover:text-white/40 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100">
                          {activeTab === "published" ? <Eye className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        </button>
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
  );
}