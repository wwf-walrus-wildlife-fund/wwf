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

      const datasetObject = await (client as any).getObject({
        id: datasetId,
        options: { showContent: true },
      });
      const fields = datasetObject?.data?.content?.fields;
      if (!fields) {
        throw new Error("Dataset object not found");
      }

      const priceMist = BigInt(fields.price_sui);
      const namespaceId = fields.derivation_id as string;
      if (!namespaceId) {
        throw new Error("Dataset derivation namespace is missing");
      }

      const accountId = deriveObjectID(
        namespaceId,
        `${packageId}::account::AccountTag`,
        bcs.Address.serialize(currentAccount.address).toBytes(),
      );

      const { data: coins } = await (client as any).getCoins({
        owner: currentAccount.address,
        coinType: "0x2::sui::SUI",
      });
      if (!coins?.length) {
        throw new Error("You have no SUI coins. Please fund your wallet.");
      }

      const totalBalance = coins.reduce(
        (sum: bigint, coin: { balance: string }) => sum + BigInt(coin.balance),
        0n,
      );
      if (totalBalance < priceMist) {
        const needed = (Number(priceMist) / 1_000_000_000).toFixed(2);
        const available = (Number(totalBalance) / 1_000_000_000).toFixed(2);
        throw new Error(
          `Insufficient SUI balance. Need ${needed} SUI but only have ${available} SUI.`,
        );
      }

      const singleCoin = coins.find(
        (coin: { balance: string }) => BigInt(coin.balance) >= priceMist,
      );
      const selectedCoins = singleCoin
        ? [singleCoin]
        : (() => {
            const picked = [];
            let running = 0n;
            for (const coin of coins) {
              picked.push(coin);
              running += BigInt(coin.balance);
              if (running >= priceMist) break;
            }
            return picked;
          })();

      const tx = new Transaction();
      const paymentAmount = tx.pure.u64(priceMist);
      let paymentCoin;

      if (selectedCoins.length === 1) {
        const onlyCoin = selectedCoins[0];
        const onlyCoinInput = tx.object(onlyCoin.coinObjectId);
        if (BigInt(onlyCoin.balance) === priceMist) {
          paymentCoin = onlyCoinInput;
        } else {
          paymentCoin = tx.splitCoins(onlyCoinInput, [paymentAmount])[0];
        }
      } else {
        const primaryInput = tx.object(selectedCoins[0].coinObjectId);
        const restInputs = selectedCoins
          .slice(1)
          .map((coin: { coinObjectId: string }) => tx.object(coin.coinObjectId));
        tx.mergeCoins(primaryInput, restInputs);
        paymentCoin = tx.splitCoins(primaryInput, [paymentAmount])[0];
      }

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
