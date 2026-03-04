import Link from "next/link";
import { Database, Clock, Users, ArrowUpRight } from "lucide-react";
import type { Dataset } from "@/lib/types";

const categoryColors: Record<string, string> = {
  "AI Training":
    "from-indigo-500/20 to-indigo-500/5 text-indigo-300 border-indigo-500/20",
  Financial:
    "from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-emerald-500/20",
  Healthcare:
    "from-rose-500/20 to-rose-500/5 text-rose-300 border-rose-500/20",
  Geospatial:
    "from-cyan-500/20 to-cyan-500/5 text-cyan-300 border-cyan-500/20",
  Social:
    "from-amber-500/20 to-amber-500/5 text-amber-300 border-amber-500/20",
  IoT: "from-purple-500/20 to-purple-500/5 text-purple-300 border-purple-500/20",
};

export function DatasetCard({ dataset }: { dataset: Dataset }) {
  const colorClass =
    categoryColors[dataset.category] || categoryColors["AI Training"];

  return (
    <Link href={`/dataset/${dataset.id}`} className="block group">
      <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-[#6C5CE7]/20 transition-all duration-300 h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`px-3 py-1.5 rounded-md bg-gradient-to-r ${colorClass} border`}
            style={{ fontSize: "0.8rem" }}
          >
            {dataset.category}
          </div>
          <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-[#65C8D0] transition-colors" />
        </div>

        <h3
          className="text-white mb-2 group-hover:text-[#C4B5FD] transition-colors"
          style={{ fontSize: "1.05rem" }}
        >
          {dataset.name}
        </h3>
        <p
          className="text-white/35 mb-4 line-clamp-2"
          style={{ fontSize: "0.9rem", lineHeight: "1.6" }}
        >
          {dataset.description}
        </p>

        <div
          className="flex items-center gap-4 mb-4 text-white/25"
          style={{ fontSize: "0.85rem" }}
        >
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> {dataset.size}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {dataset.downloads}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {dataset.expiresIn}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
          <div>
            <span className="text-[#C4B5FD]" style={{ fontSize: "1.2rem" }}>
              {dataset.price}
            </span>
            <span className="text-white/20 ml-1" style={{ fontSize: "0.85rem" }}>
              SUI
            </span>
          </div>
          {dataset.verified && (
            <div
              className="flex items-center gap-1 text-emerald-400/60"
              style={{ fontSize: "0.78rem" }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Verified
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
