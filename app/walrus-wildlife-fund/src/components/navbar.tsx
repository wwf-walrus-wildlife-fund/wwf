"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import logo from "@/app/wwf-walrus-logo.png";
import {
  Menu,
  X,
  Upload,
  ShoppingBag,
  LayoutDashboard,
  Search,
  FileSearch,
} from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit-react";

const links = [
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Find User", icon: Search },
  { href: "/search/dataset", label: "Find Dataset", icon: FileSearch },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#4d6cb3]"
      style={{
        background: "linear-gradient(180deg, rgba(27,42,79,0.98), rgba(17,27,51,0.96))",
        boxShadow: "0 4px 0 #000",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src={logo}
              alt="TuskBazaar logo"
              width={32}
              height={32}
              className="border-2 border-[#8ef8f7]"
            />
            <span
              className="tracking-wide text-[#f8f7d2]"
              style={{
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                letterSpacing: "2px",
                fontSize: "0.68rem",
              }}
            >
              Tusk<span className="text-[#ff4d9e]">Bazaar</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 border-2 transition-all duration-200 flex items-center gap-2 ${
                  isActive(link.href)
                    ? "bg-[#ff4d9e] text-[#0a1020] border-[#ffe066]"
                    : "bg-[#1b2a4f] text-[#8ef8f7] border-[#466aa8] hover:border-[#ffe066] hover:text-[#ffe066]"
                }`}
                style={{ fontSize: "0.82rem" }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ConnectButton />

            <button
              className="md:hidden p-2 text-[#8ef8f7] border-2 border-[#466aa8] bg-[#1b2a4f] hover:text-[#ffe066] hover:border-[#ffe066]"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t-2 border-[#4d6cb3] px-4 py-3 space-y-2 bg-[#111b33]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 border-2 transition-all flex items-center gap-3 ${
                isActive(link.href)
                  ? "bg-[#ff4d9e] text-[#0a1020] border-[#ffe066]"
                  : "bg-[#1b2a4f] text-[#8ef8f7] border-[#466aa8] hover:border-[#ffe066] hover:text-[#ffe066]"
              }`}
              style={{ fontSize: "0.85rem" }}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
