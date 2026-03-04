"use client";

import { motion } from "motion/react";
import { GlowOrb } from "@/components/glow-orb";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SearchForm } from "@/components/search-form";

export default function DatasetSearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative min-h-screen pt-24 pb-16 px-6 lg:px-10">
        <GlowOrb color="indigo" size="400px" top="0" right="-100px" opacity={0.06} />

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-white mb-2" style={{ fontSize: "2rem" }}>
              Find Dataset
            </h1>
            <p className="text-white/30">
              Enter a dataset object id to open the dataset details page.
            </p>
          </motion.div>

          <SearchForm type="dataset" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
