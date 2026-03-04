import { stats } from "@/lib/mock-data";
import type { Stat } from "@/lib/types";

export function useStats(): {
  stats: Stat[];
  isLoading: boolean;
} {
  return {
    stats,
    isLoading: false,
  };
}
