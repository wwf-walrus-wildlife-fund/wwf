"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Clock,
  Database,
  Users,
  Shield,
  Copy,
  CheckCircle2,
  Loader2,
  Lock,
  Unlock,
  FileIcon,
  Dog,
  ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";
import { GlowOrb } from "@/components/glow-orb";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useDatasetDetail } from "@/hooks/useDatasetDetail";
import { useUserItemCheck } from "@/hooks/useUserItemCheck";
import { useBuy } from "@/hooks/useBuy";
import { useDecrypt } from "@/hooks/useDecrypt";

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { dataset, isLoading } = useDatasetDetail(id);
  const { hasBought, isChecking, recheck } = useUserItemCheck(id);
  const { buy, isBuying, error: buyError } = useBuy();
  const { decrypt, isDecrypting, decryptedData, error: decryptError } = useDecrypt();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="text-center">
            <Loader2 className="w-6 h-6 text-[#a29bfe] animate-spin mx-auto mb-3" />
            <p className="text-white/30">Loading dataset...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="text-center">
            <p className="text-white/30">Dataset not found.</p>
            <Link
              href="/marketplace"
              className="text-[#65C8D0] mt-4 inline-block"
              style={{ fontSize: "0.85rem" }}
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleBuy = async () => {
    const success = await buy(id);
    if (success) {
      await recheck();
      router.refresh();
    }
  };

  const handleDecrypt = async () => {
    const result = await decrypt(id);
    if (!result) return;
    const text = await result.text();
    const txtBlob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(txtBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset.name.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!decryptedData) return;
    const url = URL.createObjectURL(decryptedData);
    const a = document.createElement("a");
    a.href = url;
    const safeName = dataset.name.replace(/\s+/g, "_");
    a.download = safeName.includes(".") ? safeName : `${safeName}.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dataset.seller || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative min-h-screen pt-24 pb-16 px-6 lg:px-10">
        <GlowOrb color="indigo" size="400px" top="0" right="0" opacity={0.05} />

        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href="/marketplace"
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
                      <h1
                        className="text-white mb-2"
                        style={{ fontSize: "1.5rem" }}
                      >
                        {dataset.name}
                      </h1>
                      <div className="flex items-center gap-3">
                        <span
                          className="px-2.5 py-1 rounded-md bg-[#4834D4]/15 text-[#C4B5FD] border border-[#4834D4]/25"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {dataset.category}
                        </span>
                        {dataset.verified && (
                          <span
                            className="flex items-center gap-1 text-emerald-400/60"
                            style={{ fontSize: "0.7rem" }}
                          >
                            <Shield className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-white/40 mb-6"
                    style={{ lineHeight: "1.7" }}
                  >
                    {dataset.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Size", value: dataset.size, icon: Database },
                      { label: "Format", value: dataset.format, icon: Download },
                      {
                        label: "Downloads",
                        value: dataset.downloads.toLocaleString(),
                        icon: Users,
                      },
                      { label: "Expires", value: dataset.expiresIn, icon: Clock },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      >
                        <item.icon className="w-4 h-4 text-white/15 mb-2" />
                        <p
                          className="text-white/20 mb-0.5"
                          style={{
                            fontSize: "0.65rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {item.label}
                        </p>
                        <p className="text-white/70" style={{ fontSize: "0.9rem" }}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seller info */}
                <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h3
                    className="text-white/60 mb-4"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Provider
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4834D4]/30 to-[#6C5CE7]/30 flex items-center justify-center">
                        <span
                          className="text-[#C4B5FD]"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <FileIcon />
                        </span>
                      </div>
                      <div>
                        <p
                          className="text-white/60"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "0.85rem",
                          }}
                        >
                          {dataset.seller}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-all"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <Link href={"https://testnet.suivision.xyz/account/" + dataset.seller} className="p-2 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h3
                    className="text-white/60 mb-4"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Blob ID
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4834D4]/30 to-[#6C5CE7]/30 flex items-center justify-center">
                        <span
                          className="text-[#C4B5FD]"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <Dog />
                        </span>
                      </div>
                      <div>
                        <p
                          className="text-white/60"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "0.85rem",
                          }}
                        >
                          {dataset.blob_ids[0]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-all"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <Link href={"https://walruscan.com/testnet/blob/" + dataset.blob_ids[0]} className="p-2 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar - Purchase / Decrypt */}
              <div className="space-y-4">
                <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] sticky top-24">
                  {isChecking ? (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="w-6 h-6 text-[#a29bfe] animate-spin mb-3" />
                      <p className="text-white/30" style={{ fontSize: "0.85rem" }}>
                        Checking ownership...
                      </p>
                    </div>
                  ) : hasBought ? (
                    /* Decrypt flow — user owns this dataset */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <p
                          className="text-emerald-300"
                          style={{ fontSize: "0.85rem" }}
                        >
                          You own this dataset
                        </p>
                      </div>

                      {decryptedData ? (
                        <button
                          onClick={handleDownload}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                        >
                          <Download className="w-4 h-4" /> Download Data
                        </button>
                      ) : (
                        <button
                          onClick={handleDecrypt}
                          disabled={isDecrypting}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4834D4] to-[#6C5CE7] text-white hover:from-[#6C5CE7] hover:to-[#A29BFE] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4834D4]/20 disabled:opacity-50"
                        >
                          {isDecrypting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Decrypting via Seal...
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4" />
                              Decrypt with Seal
                            </>
                          )}
                        </button>
                      )}

                      {decryptError && (
                        <p className="text-red-400 text-center" style={{ fontSize: "0.8rem" }}>
                          {decryptError}
                        </p>
                      )}

                      <p
                        className="text-center text-white/10"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Data is decrypted locally using Seal
                      </p>
                    </div>
                  ) : (
                    /* Buy flow — user hasn't purchased yet */
                    <div>
                      <div className="flex items-center gap-2 justify-center mb-4">
                        <Lock className="w-4 h-4 text-white/20" />
                        <p className="text-white/30" style={{ fontSize: "0.8rem" }}>
                          Encrypted on Walrus
                        </p>
                      </div>

                      <div className="text-center mb-6">
                        <p
                          className="text-white/20 mb-1"
                          style={{
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Price
                        </p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span
                            className="text-white"
                            style={{ fontSize: "2.5rem" }}
                          >
                            {dataset.price}
                          </span>
                          <span className="text-white/30">SUI</span>
                        </div>
                      </div>

                      <button
                        onClick={handleBuy}
                        disabled={isBuying}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4834D4] to-[#6C5CE7] text-white hover:from-[#6C5CE7] hover:to-[#A29BFE] transition-all duration-300 shadow-lg shadow-[#4834D4]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isBuying ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Buy for ${dataset.price} SUI`
                        )}
                      </button>

                      {buyError && (
                        <p className="text-red-400 text-center mt-3" style={{ fontSize: "0.8rem" }}>
                          {buyError}
                        </p>
                      )}

                      <p
                        className="text-center text-white/10 mt-3"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Sponsored transaction &middot; No gas fees
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
