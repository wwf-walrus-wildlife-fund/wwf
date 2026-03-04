import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount, useCurrentClient } from "@mysten/dapp-kit-react";
import { canRead } from "@/hooks/useRead";

interface UseUserItemCheckReturn {
  hasBought: boolean;
  isChecking: boolean;
  recheck: () => Promise<void>;
}

export function useUserItemCheck(datasetId: string): UseUserItemCheckReturn {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const [hasBought, setHasBought] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const check = useCallback(async () => {
    if (!account?.address) {
      setHasBought(false);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const owned = await canRead(datasetId, account.address, client);
      setHasBought(owned);
    } catch (err) {
      console.error("Failed to check ownership:", err);
      setHasBought(false);
    } finally {
      setIsChecking(false);
    }
  }, [account?.address, client, datasetId]);

  useEffect(() => {
    check();
  }, [check]);

  return { hasBought, isChecking, recheck: check };
}
