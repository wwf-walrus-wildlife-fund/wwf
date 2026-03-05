'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { deriveObjectID } from '@mysten/sui/utils';
import { encryptDEK } from '@/lib/seal';
import { generateDEK, encryptFile } from '@/lib/crypto';
import { normalizeWalrusEpochs, uploadToWalrus, uploadMultipleToWalrus, uploadQuiltToWalrus } from '@/lib/walrus';
import type { FileManifest } from '@/lib/types';

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
    files: File[];
    name: string;
    description: string;
    category: string;
    price: string;
    storageDays: number;
    imageUrl?: string;
    project?: string;
    projectUrl?: string;
    fundsReceiver?: string;
    /** Force quilt bundling even when file count is low. */
    useQuilt?: boolean;
}

export interface UploadResult {
    datasetObjectId: string;
    blobIds: string[];
    txDigest: string;
}

interface UseUploadReturn {
    upload: (params: UploadParams) => Promise<string | null>;
    progress: UploadProgress;
    isUploading: boolean;
    isSuccess: boolean;
    result: UploadResult | null;
    error: string | null;
    reset: () => void;
}

const INITIAL_PROGRESS: UploadProgress = { step: 'idle', percent: 0, message: '' };

function makeProgress(step: UploadStep, percent: number, message: string): UploadProgress {
    return { step, percent, message };
}

/**
 * Use quilt when there are multiple files (2+).
 * Single files go as a regular blob. The Walrus quilt API handles
 * batching and is more cost-efficient for many small files.
 */
function shouldUseQuilt(files: File[], forceQuilt?: boolean): boolean {
    if (forceQuilt) return true;
    return files.length > 1;
}

// ============================================================
// useUpload — envelope encryption pipeline
// ============================================================

/**
 * Pipeline (envelope encryption):
 * 1. Read all file bytes
 * 2. Derive future Dataset object ID from namespace counter
 * 3. Generate AES-256-GCM DEK, encrypt each file with DEK
 * 4. Upload encrypted blobs to Walrus (parallel blobs or quilt)
 * 5. Seal-encrypt the DEK (32 bytes — fast)
 * 6. Build & execute on-chain transaction with envelope + blob_ids + manifest
 */
export function useUpload(): UseUploadReturn {
    const [progress, setProgress] = useState<UploadProgress>(INITIAL_PROGRESS);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const account = useCurrentAccount();
    const suiClient = useCurrentClient();
    const { signAndExecuteTransaction } = useDAppKit();

    const reset = useCallback(() => {
        setProgress(INITIAL_PROGRESS);
        setIsUploading(false);
        setIsSuccess(false);
        setResult(null);
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
                // ── 1. Read all files ──
                setProgress(makeProgress('reading-file', 5, 'Reading files…'));
                const fileBuffers: Uint8Array[] = await Promise.all(
                    params.files.map((f) => f.arrayBuffer().then((b) => new Uint8Array(b))),
                );

                // ── 2. Derive future Dataset object ID ──
                setProgress(makeProgress('deriving-id', 10, 'Preparing dataset…'));

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
                let newAccount;
                if (!accountExists) {
                    newAccount = tx.moveCall({
                        target: `${packageId}::account::new`,
                        arguments: [tx.object(platformObjectId)],
                    });
                }

                // ── 3. Generate DEK & AES-encrypt each file ──
                setProgress(makeProgress('encrypting', 20, 'Encrypting files…'));
                const dek = await generateDEK();
                const encryptedBuffers = await Promise.all(
                    fileBuffers.map((buf) => encryptFile(dek, buf)),
                );

                // ── 4. Upload to Walrus ──
                setProgress(makeProgress('uploading', 35, 'Uploading to Walrus…'));
                const epochs = normalizeWalrusEpochs(params.storageDays);
                const useQuilt = shouldUseQuilt(params.files, params.useQuilt);

                let blobIds: string[];
                let manifest: FileManifest;

                if (useQuilt) {
                    // Upload encrypted files as a Walrus quilt via /v1/quilts.
                    // Use safe identifiers (no spaces/special chars) so the
                    // response's storedQuiltBlobs identifiers match reliably.
                    const identifiers = encryptedBuffers.map((_, i) => `patch-${i}`);
                    const quiltResult = await uploadQuiltToWalrus(
                        encryptedBuffers.map((buf, i) => ({
                            identifier: identifiers[i],
                            data: buf,
                        })),
                        account.address,
                        epochs,
                    );
                    blobIds = [quiltResult.quiltBlobId];

                    const patchMap = new Map(
                        quiltResult.patches.map((p) => [p.identifier, p.quiltPatchId]),
                    );

                    console.log('[useUpload] quilt identifiers sent:', identifiers);
                    console.log('[useUpload] quilt patches received:', quiltResult.patches);
                    console.log('[useUpload] patchMap entries:', [...patchMap.entries()]);

                    // Validate every file got a patch ID before storing manifest
                    const manifestFiles = params.files.map((f, i) => {
                        const patchId = patchMap.get(identifiers[i]);
                        if (!patchId) {
                            throw new Error(
                                `Quilt upload succeeded but no patch ID returned for ` +
                                `identifier "${identifiers[i]}" (file "${f.name}"). ` +
                                `Response had ${quiltResult.patches.length} patches: ` +
                                `[${quiltResult.patches.map((p) => p.identifier).join(', ')}]`,
                            );
                        }
                        return {
                            name: f.name,
                            size: f.size,
                            mimeType: f.type || 'application/octet-stream',
                            blobIndex: 0,
                            quiltIdentifier: identifiers[i],
                            quiltPatchId: patchId,
                        };
                    });

                    manifest = {
                        version: 1,
                        storageType: 'quilt',
                        files: manifestFiles,
                    };
                } else {
                    // Upload each encrypted file as a separate blob
                    const results = await uploadMultipleToWalrus(
                        encryptedBuffers.map((buf, i) => ({
                            data: buf,
                            label: params.files[i].name,
                        })),
                        account.address,
                        epochs,
                    );
                    blobIds = results.map((r) => r.blobId);
                    manifest = {
                        version: 1,
                        storageType: 'blobs',
                        files: params.files.map((f, i) => ({
                            name: f.name,
                            size: f.size,
                            mimeType: f.type || 'application/octet-stream',
                            blobIndex: i,
                        })),
                    };
                }

                // ── 5. Seal-encrypt the DEK (32 bytes — fast) ──
                setProgress(makeProgress('sealing-key', 65, 'Sealing encryption key…'));
                const sealedDEK = await encryptDEK(suiClient, datasetObjectId, 0, dek);

                // ── 6. Build & execute on-chain transaction ──
                setProgress(makeProgress('publishing-tx', 80, 'Publishing on-chain…'));

                const priceMist = BigInt(
                    Math.round(parseFloat(params.price) * 1_000_000_000),
                );

                const dataset = tx.moveCall({
                    target: `${packageId}::dataset::new_derived`,
                    arguments: [
                        tx.object(platformObjectId),
                        newAccount ? newAccount : tx.object(accountObjectId),
                        tx.pure.string(params.name),
                        tx.pure.string(params.description),
                        tx.pure.string(params.imageUrl ?? ''),
                        tx.pure.string(params.project ?? params.category),
                        tx.pure.string(params.projectUrl ?? ''),
                        tx.pure.vector('u8', Array.from(sealedDEK)),
                        tx.pure.vector('string', blobIds),
                        tx.pure.string(JSON.stringify(manifest)),
                        tx.pure.u64(priceMist),
                        tx.pure.address(params.fundsReceiver ?? account.address),
                    ],
                });

                tx.moveCall({
                    target: `${packageId}::dataset::share`,
                    arguments: [dataset],
                });

                if (!accountExists && newAccount) {
                    tx.moveCall({
                        target: `${packageId}::account::share`,
                        arguments: [newAccount],
                    });
                }

                const txResult = await signAndExecuteTransaction({
                    transaction: tx,
                });

                // ── Done ──
                const txDigest = (txResult as any)?.digest ?? '';
                setResult({ datasetObjectId, blobIds, txDigest });
                setIsSuccess(true);
                setProgress(makeProgress('done', 100, 'Dataset published!'));
                return datasetObjectId;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Upload failed';
                setError(errMsg);
                setProgress(makeProgress('error', 0, errMsg));
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        [account, signAndExecuteTransaction, suiClient],
    );

    return { upload, progress, isUploading, isSuccess, result, error, reset };
}
