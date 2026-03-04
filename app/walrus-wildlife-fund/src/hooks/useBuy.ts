import { useState, useCallback } from "react";

interface UseBuyReturn {
  buy: (datasetId: string) => Promise<boolean>;
  isBuying: boolean;
  error: string | null;
}

export function useBuy(): UseBuyReturn {
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(async (datasetId: string): Promise<boolean> => {
    setIsBuying(true);
    setError(null);

    try {
      // TODO: Replace with actual SUI smart contract transaction
      // Mock: simulate a 2s purchase transaction
      await new Promise((r) => setTimeout(r, 2000));

      console.log(`Purchased dataset ${datasetId} on SUI`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed";
      setError(message);
      return false;
    } finally {
      setIsBuying(false);
    }
  }, []);

  return { buy, isBuying, error };
}
