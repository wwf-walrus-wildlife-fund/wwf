"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Upload, ShoppingBag, LayoutDashboard } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit-react";

const links = [
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(5, 5, 16, 0.8)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-white tracking-wide"
              style={{
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "1px",
              }}
            >
              Tusk<span className="text-[#a29bfe]">Bazaar</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  isActive(link.href)
                    ? "bg-[#6C5CE7]/10 text-[#a29bfe]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ConnectButton />

            <button
              className="md:hidden p-2 text-white/60 hover:text-white"
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
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                isActive(link.href)
                  ? "bg-[#6C5CE7]/10 text-[#a29bfe]"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
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
