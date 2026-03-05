"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, Bot, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { GlowOrb } from "@/components/glow-orb";
import { DatasetCard } from "@/components/dataset-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useTrendingDatasets, useStats } from "@/hooks/useFeed";

const features = [
  {
    icon: Shield,
    title: "zkLogin on Sui ",
    description:
      "Authenticate with Google, Apple, or Twitch. No wallet setup, no seed phrases.",
    gradient: "from-[#6C5CE7] to-[#A29BFE]",
  },
  {
    icon: Zap,
    title: "Sponsored Transactions",
    description:
      "Zero gas fees for users. All transactions are invisibly sponsored on-chain.",
    gradient: "from-[#A29BFE] to-[#C4B5FD]",
  },
  {
    icon: Globe,
    title: "Decentralized Storage",
    description:
      "Data stored on Walrus with configurable duration from 14 to 365 days.",
    gradient: "from-[#65C8D0] to-[#A29BFE]",
  },
  {
    icon: Bot,
    title: "Agent-Ready APIs",
    description:
      "First-class support for AI agents and LLMs to programmatically buy and consume data.",
    gradient: "from-[#65C8D0] to-[#4834D4]",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Connect",
    desc: "Sign in with Google, Apple, or Twitch via zkLogin. Your identity stays private.",
  },
  {
    step: "02",
    title: "Upload or Browse",
    desc: "Upload your data with a storage duration, or browse thousands of datasets in the marketplace.",
  },
  {
    step: "03",
    title: "Transact",
    desc: "Buy data instantly. All transactions are gasless and sponsored on your behalf.",
  },
];

export default function LandingPage() {
  const { datasets: trending } = useTrendingDatasets(6);
  const { stats } = useStats();

  return (
    <div className="min-h-screen bg-background retro-shell">
      <Navbar />
      <div className="relative overflow-hidden">
        {/* Hero */}
        <section className="relative min-h-screen flex items-center justify-center pt-16">
          <GlowOrb color="purple" size="600px" top="-200px" left="-100px" opacity={0.12} />
          <GlowOrb color="indigo" size="500px" top="100px" right="-150px" opacity={0.08} />
          <GlowOrb color="cyan" size="300px" bottom="50px" left="30%" opacity={0.06} />

          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#4d6cb3] bg-[#1b2a4f] mb-8">
                <div className="w-2 h-2 bg-[#8ef8f7] animate-pulse" />
                <span className="text-[#8ef8f7]" style={{ fontSize: "0.85rem" }}>
                  STAGE 01 - Sui + Walrus online
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-[#f8f7d2] mb-6 tracking-tight max-w-4xl mx-auto"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1.1" }}
            >
              The Arcade for
              <br />
              <span className="bg-gradient-to-r from-[#ff4d9e] via-[#ffe066] to-[#8ef8f7] bg-clip-text text-transparent">
                pixel-powered data
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="retro-muted max-w-xl mx-auto mb-10"
              style={{ fontSize: "1.05rem", lineHeight: "1.7" }}
            >
              Upload, monetize, and unlock datasets in a neon block-market.
              Retro look, modern on-chain speed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/marketplace"
                className="group px-8 py-3.5 border-2 border-[#ffe066] bg-[#ff4d9e] text-[#0a1020] hover:bg-[#ffe066] transition-all duration-300 flex items-center gap-2"
              >
                Start Game
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/upload"
                className="px-8 py-3.5 border-2 border-[#4d6cb3] text-[#8ef8f7] bg-[#1b2a4f] hover:text-[#ffe066] hover:border-[#ffe066] transition-all duration-300"
              >
                Drop Blocks
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-[#ffe066] mb-1" style={{ fontSize: "1.6rem" }}>
                    {stat.value}
                  </div>
                  <div
                    className="text-[#85a3c7]"
                    style={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="relative py-32 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-[#8ef8f7] mb-4" style={{ fontSize: "2rem" }}>
                Built different
              </h2>
              <p className="retro-muted max-w-lg mx-auto">
                Every interaction is designed to feel invisible. No popups, no
                confirmations, no friction.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-8 retro-panel transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 border-2 border-black bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 opacity-85 group-hover:opacity-100 transition-opacity`}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3
                    className="text-[#f8f7d2] mb-2"
                    style={{ fontSize: "0.95rem" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="retro-muted"
                    style={{ fontSize: "0.8rem", lineHeight: "1.6" }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="relative py-24 px-6 lg:px-10">
          <GlowOrb color="purple" size="400px" top="0" right="10%" opacity={0.06} />
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-[#8ef8f7] mb-4" style={{ fontSize: "2rem" }}>
                How it works
              </h2>
              <p className="retro-muted">Three stages. No wallet boss fight.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative"
                >
                  <div
                    className="text-[#ff4d9e]/60 mb-4"
                    style={{
                      fontSize: "3rem",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-[#f8f7d2] mb-2">{item.title}</h3>
                  <p
                    className="retro-muted"
                    style={{ fontSize: "0.85rem", lineHeight: "1.7" }}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Datasets */}
        <section className="relative py-24 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2
                  className="text-[#8ef8f7] mb-2"
                  style={{ fontSize: "1.5rem" }}
                >
                  Trending datasets
                </h2>
                <p className="retro-muted" style={{ fontSize: "0.85rem" }}>
                  Most popular this week
                </p>
              </div>
              <Link
                href="/marketplace"
                className="flex items-center gap-1 text-[#8ef8f7] hover:text-[#ffe066] transition-colors"
                style={{ fontSize: "0.85rem" }}
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-32 px-6 lg:px-10">
          <GlowOrb color="purple" size="500px" top="-100px" left="30%" opacity={0.1} />
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="p-12 retro-panel">
              <h2
                className="text-[#f8f7d2] mb-4"
                style={{ fontSize: "1.8rem" }}
              >
                Ready to monetize your data?
              </h2>
              <p className="retro-muted mb-8 max-w-md mx-auto">
                Join thousands of data providers and AI agents trading on
                TuskBazaar.
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#ffe066] bg-[#ff4d9e] text-[#0a1020] hover:bg-[#ffe066] transition-all duration-300"
              >
                Start Uploading <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
