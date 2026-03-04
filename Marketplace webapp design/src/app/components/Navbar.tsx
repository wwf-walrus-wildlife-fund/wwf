import { Link, useLocation } from "react-router";
import { useState } from "react";
import { Menu, X, Upload, ShoppingBag, LayoutDashboard } from "lucide-react";
import { AuthModal } from "./AuthModal";
import logoImg from "figma:asset/bdb728a8186761de4d21508ce9e171d914f3405a.png";

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const links = [
    { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { to: "/upload", label: "Upload", icon: Upload },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{ backdropFilter: "blur(20px)", background: "rgba(5, 5, 16, 0.8)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logoImg} alt="TuskBazaar" className="w-9 h-9 object-contain" style={{ mixBlendMode: "screen" }} />
              <span className="text-white tracking-wide" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "1px" }}>
                Tusk<span className="text-[#a29bfe]">Bazaar</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    isActive(link.to)
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
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-[#65C8D0] animate-pulse" />
                    <span className="text-white/60" style={{ fontSize: "0.8rem" }}>0x7f...3a2d</span>
                  </div>
                  <button
                    onClick={() => setIsLoggedIn(false)}
                    className="px-4 py-2 rounded-lg text-white/50 hover:text-white/80 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#4834D4] to-[#6C5CE7] text-white hover:from-[#6C5CE7] hover:to-[#A29BFE] transition-all duration-300 shadow-lg shadow-[#4834D4]/20"
                >
                  Connect
                </button>
              )}

              <button
                className="md:hidden p-2 text-white/60 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                  isActive(link.to)
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

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={() => {
          setIsLoggedIn(true);
          setAuthOpen(false);
        }}
      />
    </>
  );
}