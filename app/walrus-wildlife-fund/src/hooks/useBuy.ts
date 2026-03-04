import { useState, useCallback } from "react";
import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";

interface UseBuyReturn {
  buy: (datasetId: string) => Promise<boolean>;
  isBuying: boolean;
  error: string | null;
}

export function useBuy(): UseBuyReturn {
  const currentAccount = useCurrentAccount();
  const client = useCurrentClient();
  const { signAndExecuteTransaction } = useDAppKit();
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(async (datasetId: string): Promise<boolean> => {
    setIsBuying(true);
    setError(null);

    try {
      if (!currentAccount) {
        throw new Error("No wallet connected");
      }

      const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
      if (!packageId) {
        throw new Error("Missing NEXT_PUBLIC_PACKAGE_ID");
      }

      const datasetObject = await client.getObject({
        objectId: datasetId,
        include: { json: true },
      });
      const fields = datasetObject.object.json;
      if (!fields) {
        throw new Error(`Dataset object not found: ${datasetId}`);
      }

      const priceMist = BigInt(fields!.price_sui as string);
      const namespaceId = fields.derivation_id as string;
      if (!namespaceId) {
        throw new Error("Dataset derivation namespace is missing");
      }

      const accountId = deriveObjectID(
        namespaceId,
        `${packageId}::account::AccountTag`,
        bcs.Address.serialize(currentAccount.address).toBytes(),
      );
      const accountObject = await client.getObject({
        objectId: accountId,
        include: { json: true },
      }).catch(
        () => null,
      );
      const accountExists = Boolean(accountObject?.object?.json);
      if (!accountExists) {
        const setupTx = new Transaction();
        const newAccount = setupTx.moveCall({
          target: `${packageId}::account::new`,
          arguments: [setupTx.object(namespaceId)],
        });
        setupTx.moveCall({
          target: `${packageId}::account::share`,
          arguments: [newAccount],
        });
        await signAndExecuteTransaction({
          transaction: setupTx,
        });
      }

      const tx = new Transaction();
      const amount = tx.pure.u64(priceMist);
      const SUI_TYPE_ARG = tx.gas;
      const [paymentCoin] = tx.splitCoins(SUI_TYPE_ARG, [amount]);

      tx.moveCall({
        target: `${packageId}::dataset::pay_sui_to_read`,
        arguments: [
          tx.object(datasetId),
          paymentCoin,
          tx.object(accountId),
        ],
      });

      await signAndExecuteTransaction({
        transaction: tx,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed";
      setError(message);
      return false;
    } finally {
      setIsBuying(false);
    }
  }, [client, currentAccount, signAndExecuteTransaction]);

  return { buy, isBuying, error };
}
