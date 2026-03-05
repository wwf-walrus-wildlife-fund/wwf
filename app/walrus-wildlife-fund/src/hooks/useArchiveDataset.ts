'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { deriveObjectID } from '@mysten/sui/utils';

interface UseArchiveDatasetReturn {
    archiveDataset: (datasetId: string) => Promise<boolean>;
    isArchiving: boolean;
    error: string | null;
}

export function useArchiveDataset(): UseArchiveDatasetReturn {
    const [isArchiving, setIsArchiving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const account = useCurrentAccount();
    const suiClient = useCurrentClient();
    const { signAndExecuteTransaction } = useDAppKit();

    const archiveDataset = useCallback(
        async (datasetId: string): Promise<boolean> => {
            if (!account) {
                setError('No wallet connected');
                return false;
            }

            const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
            const platformObjectId = process.env.NEXT_PUBLIC_PLATFORM_OBJECT_ID;
            if (!packageId || !platformObjectId) {
                setError('Missing package or platform config');
                return false;
            }

            setIsArchiving(true);
            setError(null);

            try {
                const accountObjectId = deriveObjectID(
                    platformObjectId,
                    `${packageId}::account::AccountTag`,
                    bcs.Address.serialize(account.address).toBytes(),
                );

                const tx = new Transaction();
                tx.moveCall({
                    target: `${packageId}::dataset::archive`,
                    arguments: [
                        tx.object(datasetId),
                        tx.object(accountObjectId),
                    ],
                });

                await signAndExecuteTransaction({ transaction: tx });
                return true;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Archive failed';
                setError(msg);
                return false;
            } finally {
                setIsArchiving(false);
            }
        },
        [account, signAndExecuteTransaction, suiClient],
    );

    return { archiveDataset, isArchiving, error };
}
