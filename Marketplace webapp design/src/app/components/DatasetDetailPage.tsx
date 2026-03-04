import { useParams, Link } from "react-router";
import { useState } from "react";
import { ArrowLeft, Download, Clock, Database, Users, Shield, ExternalLink, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { GlowOrb } from "./GlowOrb";
import { datasets } from "./mockData";

export function DatasetDetailPage() {
  const { id } = useParams();
  const dataset = datasets.find((d) => d.id === id);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [rentDays, setRentDays] = useState(7);

  if (!dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="text-white/30">Dataset not found.</p>
          <Link to="/marketplace" className="text-[#65C8D0] mt-4 inline-block" style={{ fontSize: "0.85rem" }}>
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleBuy = () => {
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      setBought(true);
    }, 2000);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalRentCost = dataset.rentPrice ? (parseFloat(dataset.rentPrice) * rentDays).toFixed(1) : "0";

  return (
    <div className="relative min-h-screen pt-24 pb-16 px-4">
      <GlowOrb color="indigo" size="400px" top="0" right="0" opacity={0.05} />

      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors mb-8"
            style={{ fontSize: "0.85rem" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-white mb-2" style={{ fontSize: "1.5rem" }}>{dataset.name}</h1>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-[#4834D4]/15 text-[#C4B5FD] border border-[#4834D4]/25" style={{ fontSize: "0.7rem" }}>
                        {dataset.category}
                      </span>
                      {dataset.verified && (
                        <span className="flex items-center gap-1 text-emerald-400/60" style={{ fontSize: "0.7rem" }}>
                          <Shield className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-white/40 mb-6" style={{ lineHeight: "1.7" }}>{dataset.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {dataset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-lg bg-white/[0.04] text-white/30 border border-white/[0.05]"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Size", value: dataset.size, icon: Database },
                    { label: "Format", value: dataset.format, icon: Download },
                    { label: "Downloads", value: dataset.downloads.toLocaleString(), icon: Users },
                    { label: "Expires", value: dataset.expiresIn, icon: Clock },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <item.icon className="w-4 h-4 text-white/15 mb-2" />
                      <p className="text-white/20 mb-0.5" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {item.label}
                      </p>
                      <p className="text-white/70" style={{ fontSize: "0.9rem" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seller info */}
              <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-white/60 mb-4" style={{ fontSize: "0.9rem" }}>Provider</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4834D4]/30 to-[#6C5CE7]/30 flex items-center justify-center">
                      <span className="text-[#C4B5FD]" style={{ fontSize: "0.8rem" }}>
                        {dataset.seller.slice(0, 4)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white/60" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem" }}>
                        {dataset.seller}
                      </p>
                      <p className="text-white/20" style={{ fontSize: "0.7rem" }}>12 datasets published</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-all"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Purchase */}
            <div className="space-y-4">
              <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] sticky top-24">
                {/* Mode toggle */}
                <div className="flex rounded-lg bg-white/[0.03] border border-white/[0.06] p-1 mb-6">
                  <button
                    onClick={() => setMode("buy")}
                    className={`flex-1 py-2 rounded-md transition-all ${
                      mode === "buy" ? "bg-[#4834D4]/15 text-[#C4B5FD]" : "text-white/30"
                    }`}
                    style={{ fontSize: "0.85rem" }}
                  >
                    Buy
                  </button>
                  {dataset.rentPrice && (
                    <button
                      onClick={() => setMode("rent")}
                      className={`flex-1 py-2 rounded-md transition-all ${
                        mode === "rent" ? "bg-[#4834D4]/15 text-[#C4B5FD]" : "text-white/30"
                      }`}
                      style={{ fontSize: "0.85rem" }}
                    >
                      Rent
                    </button>
                  )}
                </div>

                {mode === "buy" ? (
                  <div className="text-center mb-6">
                    <p className="text-white/20 mb-1" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Price
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-white" style={{ fontSize: "2.5rem" }}>{dataset.price}</span>
                      <span className="text-white/30">SUI</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-white/20 mb-3 text-center" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Rental Period
                    </p>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={rentDays}
                      onChange={(e) => setRentDays(Number(e.target.value))}
                      className="w-full accent-[#6C5CE7] mb-2"
                    />
                    <div className="flex justify-between text-white/20 mb-4" style={{ fontSize: "0.7rem" }}>
                      <span>1 day</span>
                      <span className="text-[#C4B5FD]">{rentDays} days</span>
                      <span>30 days</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-white" style={{ fontSize: "2rem" }}>{totalRentCost}</span>
                        <span className="text-white/30">SUI</span>
                      </div>
                      <p className="text-white/15" style={{ fontSize: "0.7rem" }}>
                        {dataset.rentPrice} SUI/day &times; {rentDays} days
                      </p>
                    </div>
                  </div>
                )}

                {bought ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-emerald-300" style={{ fontSize: "0.85rem" }}>Access Granted</p>
                      <p className="text-white/20 mt-1" style={{ fontSize: "0.7rem" }}>Sponsored &middot; 0 gas</p>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" /> Download Data
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleBuy}
                    disabled={buying}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4834D4] to-[#6C5CE7] text-white hover:from-[#6C5CE7] hover:to-[#A29BFE] transition-all duration-300 shadow-lg shadow-[#4834D4]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {buying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      mode === "buy" ? `Buy for ${dataset.price} SUI` : `Rent for ${totalRentCost} SUI`
                    )}
                  </button>
                )}

                <p className="text-center text-white/10 mt-3" style={{ fontSize: "0.7rem" }}>
                  Sponsored transaction &middot; No gas fees
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}