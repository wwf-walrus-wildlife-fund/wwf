'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { deriveObjectID } from '@mysten/sui/utils';
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

interface UseArchiveAndDeleteDatasetReturn {
    archiveAndDelete: (datasetId: string, blobObjectIds: string[]) => Promise<boolean>;
    isPending: boolean;
    error: string | null;
}

/**
 * Archives a dataset on-chain and deletes its Walrus blobs in a single PTB.
 */
export function useArchiveAndDeleteDataset(): UseArchiveAndDeleteDatasetReturn {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const account = useCurrentAccount();
    const suiClient = useCurrentClient();
    const { signAndExecuteTransaction } = useDAppKit();

    const archiveAndDelete = useCallback(
        async (datasetId: string, blobObjectIds: string[]): Promise<boolean> => {
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

            if (!blobObjectIds.length) {
                setError('No blob object IDs provided');
                return false;
            }

            setIsPending(true);
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

                const walrusClient = getWalrusClient(suiClient);
                for (const blobObjectId of blobObjectIds) {
                    walrusClient.deleteBlobTransaction({
                        blobObjectId,
                        owner: account.address,
                        transaction: tx,
                    });
                }

                await signAndExecuteTransaction({ transaction: tx });
                return true;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Archive & delete failed';
                setError(msg);
                return false;
            } finally {
                setIsPending(false);
            }
        },
        [account, signAndExecuteTransaction, suiClient],
    );

    return { archiveAndDelete, isPending, error };
}
