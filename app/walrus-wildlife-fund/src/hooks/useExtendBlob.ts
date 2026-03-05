'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { WalrusClient } from '@mysten/walrus';

let _walrusClient: WalrusClient | null = null;

function getWalrusClient(suiClient: any): WalrusClient {
    if (!_walrusClient) {
        _walrusClient = new WalrusClient({
            network: 'testnet',
            suiClient,
        });
    }
    return _walrusClient;
}

interface UseExtendBlobReturn {
    extendBlobs: (blobObjectIds: string[], epochs: number) => Promise<boolean>;
    isPending: boolean;
    error: string | null;
}

export function useExtendBlob(): UseExtendBlobReturn {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const account = useCurrentAccount();
    const suiClient = useCurrentClient();
    const { signAndExecuteTransaction } = useDAppKit();

    const extendBlobs = useCallback(
        async (blobObjectIds: string[], epochs: number): Promise<boolean> => {
            if (!account) {
                setError('No wallet connected');
                return false;
            }
            if (!blobObjectIds.length) {
                setError('No blob object IDs provided');
                return false;
            }
            if (epochs < 1) {
                setError('Epochs must be at least 1');
                return false;
            }

            setIsPending(true);
            setError(null);

            try {
                const walrusClient = getWalrusClient(suiClient);
                const tx = new Transaction();

                for (const blobObjectId of blobObjectIds) {
                    await walrusClient.extendBlobTransaction({
                        blobObjectId,
                        epochs,
                        transaction: tx,
                    });
                }

                await signAndExecuteTransaction({ transaction: tx });
                return true;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Extend blob failed';
                setError(msg);
                return false;
            } finally {
                setIsPending(false);
            }
        },
        [account, signAndExecuteTransaction, suiClient],
    );

    return { extendBlobs, isPending, error };
}
