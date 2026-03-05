"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, X, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExtendBlobModalProps {
  open: boolean;
  onClose: () => void;
  datasetName: string;
  blobObjectIds: string[];
  onExtend: (blobObjectIds: string[], epochs: number) => Promise<boolean>;
  isPending: boolean;
  error: string | null;
}

const EPOCH_PRESETS = [1, 5, 10, 30, 60];

export function ExtendBlobModal({
  open,
  onClose,
  datasetName,
  blobObjectIds,
  onExtend,
  isPending,
  error,
}: ExtendBlobModalProps) {
  const [epochs, setEpochs] = useState(5);
  const [customValue, setCustomValue] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setEpochs(5);
      setCustomValue("");
      setUseCustom(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, isPending]);

  const effectiveEpochs = useCustom ? Number(customValue) || 0 : epochs;

  async function handleSubmit() {
    if (effectiveEpochs < 1) return;
    const ok = await onExtend(blobObjectIds, effectiveEpochs);
    if (ok) onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === backdropRef.current && !isPending) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0a0a1a] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#4834D4]/15">
                  <Clock className="w-4 h-4 text-[#C4B5FD]" />
                </div>
                <h2 className="text-white" style={{ fontSize: "1rem" }}>
                  Extend Storage
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isPending}
                className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-all disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-white/40 mb-1" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Dataset
                </p>
                <p className="text-white/70 truncate" style={{ fontSize: "0.9rem" }}>
                  {datasetName}
                </p>
                <p className="text-white/20 mt-1" style={{ fontSize: "0.75rem" }}>
                  {blobObjectIds.length} blob{blobObjectIds.length !== 1 ? "s" : ""} will be extended
                </p>
              </div>

              {/* Preset buttons */}
              <div>
                <p className="text-white/40 mb-2.5" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Extend by (epochs)
                </p>
                <div className="flex flex-wrap gap-2">
                  {EPOCH_PRESETS.map((n) => (
                    <button
                      key={n}
                      onClick={() => { setEpochs(n); setUseCustom(false); }}
                      disabled={isPending}
                      className={`px-3.5 py-1.5 rounded-lg border transition-all ${
                        !useCustom && epochs === n
                          ? "border-[#6C5CE7]/50 bg-[#4834D4]/20 text-[#C4B5FD]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
                      } disabled:opacity-40`}
                      style={{ fontSize: "0.85rem" }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setUseCustom(true)}
                    disabled={isPending}
                    className={`px-3.5 py-1.5 rounded-lg border transition-all ${
                      useCustom
                        ? "border-[#6C5CE7]/50 bg-[#4834D4]/20 text-[#C4B5FD]"
                        : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
                    } disabled:opacity-40`}
                    style={{ fontSize: "0.85rem" }}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Custom input */}
              <AnimatePresence>
                {useCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="number"
                      min={1}
                      placeholder="Number of epochs"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      disabled={isPending}
                      className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/80 placeholder:text-white/15 focus:outline-none focus:border-[#6C5CE7]/40 transition-colors disabled:opacity-40"
                      style={{ fontSize: "0.9rem" }}
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-rose-300/80" style={{ fontSize: "0.8rem" }}>
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-5 pt-1">
              <button
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-white/30 hover:text-white/50 hover:bg-white/5 transition-all disabled:opacity-30"
                style={{ fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || effectiveEpochs < 1}
                className="px-5 py-2 rounded-lg bg-[#6C5CE7] text-white hover:bg-[#5B4BD4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ fontSize: "0.85rem" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extending…
                  </>
                ) : (
                  <>Extend by {effectiveEpochs} epoch{effectiveEpochs !== 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
