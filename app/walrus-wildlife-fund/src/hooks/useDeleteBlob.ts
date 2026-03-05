'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
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

interface UseDeleteBlobReturn {
    deleteBlob: (blobObjectId: string) => Promise<boolean>;
    isDeleting: boolean;
    error: string | null;
    reset: () => void;
}

/**
 * Hook to delete a Walrus blob (or quilt) by its Sui object ID.
 * The connected wallet must own the blob object.
 * Only works for blobs stored with `deletable: true` (the default).
 */
export function useDeleteBlob(): UseDeleteBlobReturn {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const account = useCurrentAccount();
    const suiClient = useCurrentClient();
    const { signAndExecuteTransaction } = useDAppKit();

    const reset = useCallback(() => {
        setIsDeleting(false);
        setError(null);
    }, []);

    const deleteBlob = useCallback(
        async (blobObjectId: string): Promise<boolean> => {
            if (!account) {
                setError('No wallet connected');
                return false;
            }
            if (!blobObjectId) {
                setError('No blob object ID provided');
                return false;
            }

            setIsDeleting(true);
            setError(null);

            try {
                const walrusClient = getWalrusClient(suiClient);
                const tx = walrusClient.deleteBlobTransaction({
                    blobObjectId,
                    owner: account.address,
                });

                await signAndExecuteTransaction({ transaction: tx });
                return true;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Blob deletion failed';
                setError(msg);
                return false;
            } finally {
                setIsDeleting(false);
            }
        },
        [account, signAndExecuteTransaction, suiClient],
    );

    return { deleteBlob, isDeleting, error, reset };
}
