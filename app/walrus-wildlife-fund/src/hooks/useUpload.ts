'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { deriveObjectID } from '@mysten/sui/utils';
import { getSealClient, buildSealId, SEAL_THRESHOLD } from '@/lib/seal';
import { normalizeWalrusEpochs, queryWalrusBlob, uploadToWalrus } from '@/lib/walrus';

// ============================================================
// Types
// ============================================================

export type UploadStep =
    | 'idle'
    | 'reading-file'
    | 'deriving-id'
    | 'encrypting'
    | 'uploading'
    | 'sealing-key'
    | 'publishing-tx'
    | 'done'
    | 'error';

export interface UploadProgress {
    step: UploadStep;
    percent: number;
    message: string;
}

interface UploadParams {
    file: File;
    name: string;
    description: string;
    category: string;
    price: string;
    storageDays: number;
    imageUrl?: string;
    project?: string;
    projectUrl?: string;
    fundsReceiver?: string;
}

interface UseUploadReturn {
    upload: (params: UploadParams) => Promise<string | null>;
    progress: UploadProgress;
    isUploading: boolean;
    isSuccess: boolean;
    error: string | null;
    reset: () => void;
}

const INITIAL_PROGRESS: UploadProgress = { step: 'idle', percent: 0, message: '' };

function makeProgress(step: UploadStep, percent: number, message: string): UploadProgress {
    return { step, percent, message };
}

// ============================================================
// AES-256-GCM — used for encrypting dataset blobs before Walrus
// ============================================================

async function aesGcmEncrypt(data: Uint8Array, dek: Uint8Array): Promise<Uint8Array> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey('raw', dek.buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data.buffer as ArrayBuffer);
    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv);
    result.set(new Uint8Array(ciphertext), iv.length);
    return result;
}

// ============================================================
// useUpload — full pipeline: read → encrypt → Walrus → Seal → TX
// ============================================================

/**
 * Pipeline:
 * 1. Read file bytes
 * 2. Derive future Dataset object ID from namespace counter
 * 3. AES-256-GCM encrypt file with random DEK
 * 4. Upload encrypted blob to Walrus
 * 5. Seal-encrypt the DEK (stored on-chain as envelope)
 * 6. Build & execute new_derived + share transaction
 */
export function useUpload(): UseUploadReturn {
    const [progress, setProgress] = useState<UploadProgress>(INITIAL_PROGRESS);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const account = useCurrentAccount();
    const suiClient = useCurrentClient();
    const { signAndExecuteTransaction } = useDAppKit();

    const reset = useCallback(() => {
        setProgress(INITIAL_PROGRESS);
        setIsUploading(false);
        setIsSuccess(false);
        setError(null);
    }, []);

    const upload = useCallback(
        async (params: UploadParams): Promise<string | null> => {
            if (!account) {
                setError('No wallet connected');
                return null;
            }

            const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
            const platformObjectId = process.env.NEXT_PUBLIC_PLATFORM_OBJECT_ID!;

            setIsUploading(true);
            setIsSuccess(false);
            setError(null);

            const tx = new Transaction();

            try {
                // ── 1. Read the file ──
                setProgress(makeProgress('reading-file', 5, 'Reading file…'));
                const fileBytes = new Uint8Array(await params.file.arrayBuffer());

                // ── 2. Derive future Dataset object ID ──
                setProgress(makeProgress('deriving-id', 15, 'Preparing dataset…'));

                const nsObj = await suiClient.getObject({
                    objectId: platformObjectId,
                    include: { json: true },
                }) as any;

                if (!nsObj?.object?.json) {
                    throw new Error('Namespace object not found on chain');
                }

                const counter = Number(nsObj.object.json.dataset_counter);

                const datasetObjectId = deriveObjectID(
                    platformObjectId,
                    'u64',
                    bcs.u64().serialize(counter).toBytes(),
                );
                const accountObjectId = deriveObjectID(
                    platformObjectId,
                    `${packageId}::account::AccountTag`,
                    bcs.Address.serialize(account.address).toBytes(),
                );
                console.info('[useUpload] derived ids', {
                    sender: account.address,
                    platformObjectId,
                    datasetCounter: counter,
                    datasetObjectId,
                    accountObjectId,
                });

                // Ensure the caller Account exists before using it as input object.
                // If missing, create+share it once for this address.
                let accountObj: any = null;
                try {
                    accountObj = await (suiClient as any).getObject({
                        objectId: accountObjectId,
                        include: { json: true },
                    });
                } catch {
                    accountObj = null;
                }
                const accountExists = Boolean(accountObj?.object?.json || accountObj?.data?.content);
                console.info('[useUpload] account lookup', {
                    accountObjectId,
                    exists: accountExists,
                });
                if (!accountExists) {
                    console.info('[useUpload] creating missing account object', {
                        accountObjectId,
                    });
                    const newAccount = tx.moveCall({
                        target: `${packageId}::account::new`,
                        arguments: [tx.object(platformObjectId)],
                    });
                    tx.moveCall({
                        target: `${packageId}::account::share`,
                        arguments: [newAccount],
                    });
                    await signAndExecuteTransaction({
                        transaction: tx,
                    });
                }

                // ── 3. AES-256-GCM encrypt file with random DEK ──
                setProgress(makeProgress('encrypting', 30, 'Encrypting data…'));
                const dek = crypto.getRandomValues(new Uint8Array(32));
                const encryptedData = await aesGcmEncrypt(fileBytes, dek);

                // ── 4. Upload encrypted blob to Walrus ──
                setProgress(makeProgress('uploading', 50, 'Uploading to Walrus…'));
                const epochs = normalizeWalrusEpochs(params.storageDays);
                const { blobId } = await uploadToWalrus(encryptedData, epochs);
                try {
                    await queryWalrusBlob(blobId);
                } catch (queryErr) {
                    console.warn('[useUpload] Walrus blob query failed', {
                        blobId,
                        error: queryErr,
                    });
                }

                // ── 5. Seal-encrypt the DEK → on-chain envelope ──
                setProgress(makeProgress('sealing-key', 65, 'Sealing encryption key…'));
                const sealClient = getSealClient(suiClient);
                const sealId = buildSealId(datasetObjectId, 0);

                const { encryptedObject } = await sealClient.encrypt({
                    threshold: SEAL_THRESHOLD,
                    packageId,
                    id: sealId,
                    data: dek,
                });
                const envelopeBytes = encryptedObject as Uint8Array;

                // ── 6. Build & execute on-chain transaction ──
                setProgress(makeProgress('publishing-tx', 80, 'Publishing on-chain…'));

                const priceMist = BigInt(
                    Math.round(parseFloat(params.price) * 1_000_000_000),
                );

                const dataset = tx.moveCall({
                    target: `${packageId}::dataset::new_derived`,
                    arguments: [
                        tx.object(platformObjectId),
                        tx.object(accountObjectId),
                        tx.pure.string(params.name),
                        tx.pure.string(params.description),
                        tx.pure.string(params.imageUrl ?? ''),
                        tx.pure.string(params.project ?? params.category),
                        tx.pure.string(params.projectUrl ?? ''),
                        tx.pure.vector('u8', Array.from(envelopeBytes)),
                        tx.pure.vector('string', [blobId]),
                        tx.pure.u64(priceMist),
                        tx.pure.address(params.fundsReceiver ?? account.address),
                    ],
                });

                tx.moveCall({
                    target: `${packageId}::dataset::share`,
                    arguments: [dataset],
                });

                await signAndExecuteTransaction({
                    transaction: tx,
                });

                // ── Done ──
                setIsSuccess(true);
                setProgress(makeProgress('done', 100, 'Dataset published!'));
                return datasetObjectId;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Upload failed';
                console.error('[useUpload] error:', err);
                setError(errMsg);
                setProgress(makeProgress('error', 0, errMsg));
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        [account, signAndExecuteTransaction, suiClient],
    );

    return { upload, progress, isUploading, isSuccess, error, reset };
}
