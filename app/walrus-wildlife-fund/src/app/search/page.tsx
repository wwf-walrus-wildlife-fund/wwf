"use client";

import { motion } from "motion/react";
import { GlowOrb } from "@/components/glow-orb";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SearchForm } from "@/components/search-form";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background retro-shell">
      <Navbar />
      <div className="relative min-h-screen pt-24 pb-16 px-6 lg:px-10">
        <GlowOrb color="indigo" size="400px" top="0" right="-100px" opacity={0.06} />

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-[#8ef8f7] mb-2" style={{ fontSize: "2rem" }}>
              Find User
            </h1>
            <p className="retro-muted">
              Enter a wallet address to open that user&apos;s dashboard.
            </p>
          </motion.div>

          <SearchForm type="user" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
