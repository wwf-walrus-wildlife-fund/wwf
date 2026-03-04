"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  X,
  Clock,
  Info,
  CheckCircle2,
  Loader2,
  Database,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlowOrb } from "@/components/glow-orb";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useUpload } from "@/hooks/useUpload";
import { WALRUS_MAX_EPOCHS } from "@/lib/walrus";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [storageDays, setStorageDays] = useState(30);
  const [price, setPrice] = useState("10");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("AI Training");

  const { upload, isUploading, isSuccess, error, reset } = useUpload();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => setFile(null);

  const storageCost = ((storageDays / 30) * 0.5).toFixed(2);

  const handleSubmit = () => {
    if (!file || !name) return;
    upload({ file, name, description, category, price, storageDays });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative min-h-screen flex items-center justify-center pt-16 px-6 lg:px-10">
          <GlowOrb color="emerald" size="400px" top="30%" left="30%" opacity={0.08} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#65C8D0] flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white mb-3" style={{ fontSize: "1.5rem" }}>
              Dataset Published
            </h2>
            <p className="text-white/35 mb-2">
              Your data has been encrypted and stored on Walrus for{" "}
              {storageDays} days.
            </p>
            <p className="text-white/20 mb-8" style={{ fontSize: "0.8rem" }}>
              Transaction sponsored &middot; 0 SUI gas fee
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  reset();
                  setFile(null);
                  setName("");
                  setDescription("");
                }}
                className="px-6 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                Upload Another
              </button>
              <Link
                href="/marketplace"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4834D4] to-[#6C5CE7] text-white hover:from-[#6C5CE7] hover:to-[#A29BFE] transition-all shadow-lg shadow-[#4834D4]/20"
              >
                View Marketplace
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative min-h-screen pt-24 pb-16 px-6 lg:px-10">
        <GlowOrb color="purple" size="400px" top="0" left="-100px" opacity={0.06} />

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-white mb-2" style={{ fontSize: "2rem" }}>
              Upload Data
            </h1>
            <p className="text-white/30">
              Monetize your datasets on the decentralized marketplace.
            </p>
          </motion.div>
          
          <div className="mb-8 text-center">
              Storage cost for datasets is free as we are using a Publisher
          </div>

          <div className="space-y-6">
            {/* Dropzone */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer ${
                  dragOver
                    ? "border-[#6C5CE7]/50 bg-[#6C5CE7]/5"
                    : "border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15] hover:bg-white/[0.02]"
                }`}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload
                  className={`w-8 h-8 mx-auto mb-4 transition-colors ${
                    dragOver ? "text-[#a29bfe]" : "text-white/15"
                  }`}
                />
                <p className="text-white/40 mb-1">
                  Drop a file here or{" "}
                  <span className="text-[#a29bfe] cursor-pointer">browse</span>
                </p>
                <p className="text-white/15" style={{ fontSize: "0.75rem" }}>
                  CSV, JSON, JSONL, Parquet, or any file type
                </p>
              </div>
            </motion.div>

            {/* File */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <FileText className="w-4 h-4 text-indigo-400/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-white/70 truncate"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {file.name}
                      </p>
                      <p
                        className="text-white/20"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {formatSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dataset Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <h3 className="text-white/80 mb-4">Dataset Information</h3>

              <div>
                <label
                  className="block text-white/30 mb-1.5"
                  style={{ fontSize: "0.8rem" }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., GPT Fine-tuning Corpus v2"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/15 focus:outline-none focus:border-[#6C5CE7]/30 transition-all"
                />
              </div>

              <div>
                <label
                  className="block text-white/30 mb-1.5"
                  style={{ fontSize: "0.8rem" }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your dataset, its contents, and potential use cases..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/15 focus:outline-none focus:border-[#6C5CE7]/30 transition-all resize-none"
                />
              </div>

              <div>
                <label
                  className="block text-white/30 mb-1.5"
                  style={{ fontSize: "0.8rem" }}
                >
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 focus:outline-none focus:border-[#6C5CE7]/30 transition-all appearance-none cursor-pointer"
                >
                  {[
                    "AI Training",
                    "Financial",
                    "Healthcare",
                    "Geospatial",
                    "Social",
                    "IoT",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Storage Duration */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#a29bfe]/60" />
                <h3 className="text-white/80">Storage Duration</h3>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-white/30"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Duration
                  </span>
                  <span
                    className="text-[#a29bfe] tabular-nums"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {storageDays} days
                  </span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={WALRUS_MAX_EPOCHS}
                  value={storageDays}
                  onChange={(e) => setStorageDays(Number(e.target.value))}
                  className="w-full"
                />
                <div
                  className="flex justify-between mt-2 text-white/15"
                  style={{ fontSize: "0.7rem" }}
                >
                  <span>14 days</span>
                  <span>{WALRUS_MAX_EPOCHS} days</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#6C5CE7]/5 border border-[#6C5CE7]/10">
                <Info className="w-3.5 h-3.5 text-[#a29bfe]/50 shrink-0" />
                <span
                  className="text-[#a29bfe]/50"
                  style={{ fontSize: "0.75rem" }}
                >
                  Estimated storage cost: ~{storageCost} SUI &middot; Stored on
                  Walrus (max {WALRUS_MAX_EPOCHS} days on testnet)
                </span>
              </div>
            </motion.div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#a29bfe]/60" />
                <h3 className="text-white/80">Pricing</h3>
              </div>

              <div>
                <label
                  className="block text-white/30 mb-1.5"
                  style={{ fontSize: "0.8rem" }}
                >
                  Buy Price (SUI)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-[#6C5CE7]/30 transition-all"
                  min="0"
                  step="0.1"
                />
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-300" style={{ fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleSubmit}
                disabled={!file || !name || isUploading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4834D4] to-[#6C5CE7] text-white hover:from-[#6C5CE7] hover:to-[#A29BFE] transition-all duration-300 shadow-lg shadow-[#4834D4]/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Encrypting & Uploading to Walrus...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Publish Dataset
                  </>
                )}
              </button>
              <p
                className="text-center text-white/15 mt-3"
                style={{ fontSize: "0.75rem" }}
              >
                Transaction will be sponsored &middot; No gas fees required
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
