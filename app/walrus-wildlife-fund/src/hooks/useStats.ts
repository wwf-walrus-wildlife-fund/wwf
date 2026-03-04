import { useState, useEffect } from "react";
import type { Stat } from "@/lib/types";

export function useStats(): {
  stats: Stat[];
  isLoading: boolean;
} {
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data.stats);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, isLoading };
}
