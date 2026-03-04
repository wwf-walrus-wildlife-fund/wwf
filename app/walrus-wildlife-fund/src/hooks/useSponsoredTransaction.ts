import { useState, useCallback } from "react";
import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/bcs";

interface SponsorAndExecuteOptions {
  allowedMoveCallTargets?: string[];
  allowedAddresses?: string[];
}

interface UseSponsoredTransactionReturn {
  sponsorAndExecute: (
    tx: Transaction,
    options?: SponsorAndExecuteOptions,
  ) => Promise<{ digest: string }>;
  isPending: boolean;
  error: string | null;
}

export function useSponsoredTransaction(): UseSponsoredTransactionReturn {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sponsorAndExecute = useCallback(
    async (
      tx: Transaction,
      options?: SponsorAndExecuteOptions,
    ): Promise<{ digest: string }> => {
      if (!account) throw new Error("Wallet not connected");

      setIsPending(true);
      setError(null);

      try {
        const kindBytes = await tx.build({
          client,
          onlyTransactionKind: true,
        });

        const sponsorRes = await fetch("/api/sponsor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionKindBytes: toBase64(kindBytes),
            sender: account.address,
            allowedMoveCallTargets: options?.allowedMoveCallTargets,
            allowedAddresses: options?.allowedAddresses,
          }),
        });

        if (!sponsorRes.ok) {
          const body = await sponsorRes.json().catch(() => ({}));
          throw new Error(body.error || "Sponsorship failed");
        }

        const { bytes, digest } = await sponsorRes.json();

        const { signature } = await dAppKit.signTransaction({
          transaction: bytes,
        });

        const executeRes = await fetch("/api/sponsor/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ digest, signature }),
        });

        if (!executeRes.ok) {
          const body = await executeRes.json().catch(() => ({}));
          throw new Error(body.error || "Execution failed");
        }

        return executeRes.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Sponsored transaction failed";
        setError(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [dAppKit, client, account],
  );

  return { sponsorAndExecute, isPending, error };
}
