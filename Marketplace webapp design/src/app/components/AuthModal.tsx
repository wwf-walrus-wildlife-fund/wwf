import { useState } from "react";
import { X, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logoImg from "figma:asset/bdb728a8186761de4d21508ce9e171d914f3405a.png";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function AuthModal({ open, onClose, onLogin }: AuthModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const providers = [
    { id: "google", name: "Google", color: "#4285F4", icon: "G" },
    { id: "apple", name: "Apple", color: "#ffffff", icon: "" },
    { id: "twitch", name: "Twitch", color: "#9146FF", icon: "T" },
  ];

  const handleLogin = (providerId: string) => {
    setLoading(providerId);
    setTimeout(() => {
      setLoading(null);
      onLogin();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 p-8 relative overflow-hidden"
            style={{ background: "linear-gradient(180deg, rgba(15, 15, 40, 0.98) 0%, rgba(10, 10, 30, 0.98) 100%)" }}
          >
            {/* Glow effect */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-[#4834D4]/20 rounded-full blur-3xl" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#1A1A2E] flex items-center justify-center shadow-lg shadow-[#4834D4]/20 border border-white/10 overflow-hidden">
                <img src={logoImg} alt="TuskBazaar" className="w-16 h-16 object-contain" style={{ mixBlendMode: "screen" }} />
              </div>
              <h2 className="text-white mb-2">Connect to TuskBazaar</h2>
              <p className="text-white/40" style={{ fontSize: "0.875rem" }}>
                Zero-knowledge authentication on Sui.
                <br />
                No wallet setup required.
              </p>
            </div>

            <div className="space-y-3 relative">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleLogin(provider.id)}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#4834D4]/30 transition-all duration-200 group disabled:opacity-50"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${provider.color}15` }}
                  >
                    <span style={{ color: provider.color, fontSize: "1.1rem" }}>
                      {provider.icon === "" ? "●" : provider.icon}
                    </span>
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors flex-1 text-left">
                    Continue with {provider.name}
                  </span>
                  {loading === provider.id && (
                    <div className="w-5 h-5 border-2 border-[#4834D4]/30 border-t-[#C4B5FD] rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 justify-center text-white/25" style={{ fontSize: "0.75rem" }}>
                <Zap className="w-3 h-3" />
                <span>Sponsored transactions &middot; No gas fees</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}