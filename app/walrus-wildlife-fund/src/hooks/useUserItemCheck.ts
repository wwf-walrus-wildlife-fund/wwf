import { useState, useEffect, useCallback } from "react";

interface UseUserItemCheckReturn {
  hasBought: boolean;
  isChecking: boolean;
  recheck: () => void;
}

async function checkOwnership(datasetId: string): Promise<boolean> {
  // TODO: Replace with actual SUI smart contract call
  // Mock: IDs 1 and 2 are "bought", others are not
  await new Promise((r) => setTimeout(r, 500));
  return ["1", "2"].includes(datasetId);
}

export function useUserItemCheck(datasetId: string): UseUserItemCheckReturn {
  const [hasBought, setHasBought] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const owned = await checkOwnership(datasetId);
      setHasBought(owned);
    } catch (err) {
      console.error("Failed to check ownership:", err);
      setHasBought(false);
    } finally {
      setIsChecking(false);
    }
  }, [datasetId]);

  useEffect(() => {
    check();
  }, [check]);

  return { hasBought, isChecking, recheck: check };
}
