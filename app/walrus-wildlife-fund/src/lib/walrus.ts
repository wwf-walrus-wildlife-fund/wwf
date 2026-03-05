/**
 * Walrus publisher URL — for uploading encrypted blobs (testnet).
 */
export const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";

/**
 * Walrus aggregator URL — for downloading blobs (testnet).
 */
export const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";

/**
 * Number of Walrus storage epochs (1 epoch ≈ 1 day on testnet).
 */
export const WALRUS_EPOCHS = 5;
/**
 * Walrus testnet currently caps reservation window at ~1 year.
 */
export const WALRUS_MAX_EPOCHS = 53;

export function normalizeWalrusEpochs(epochs: number): number {
    if (!Number.isFinite(epochs)) return WALRUS_EPOCHS;
    return Math.max(1, Math.min(WALRUS_MAX_EPOCHS, Math.ceil(epochs)));
}

// ============================================================
// Walrus Storage — Upload & Download blobs
// ============================================================
// Walrus is a decentralized blob storage layer on SUI.
// Blobs are addressed by a content-derived blobId.
// SEAL-encrypted data is uploaded *as-is* (opaque bytes).

export interface WalrusUploadResponse {
    /** The blob ID assigned by Walrus */
    blobId: string;
    /** Whether this was a new upload or a reference to existing blob */
    isNew: boolean;
}

export interface WalrusBlobQueryResult {
    blobId: string;
    url: string;
    method: "HEAD" | "GET";
    ok: boolean;
    status: number;
    statusText: string;
    contentType: string | null;
    contentLength: string | null;
}

const DEFAULT_CONCURRENCY = 4;

/**
 * Upload encrypted data to Walrus as a single blob.
 */
export async function uploadToWalrus(
    data: Uint8Array,
    userAddress: string,
    epochs: number = WALRUS_EPOCHS
): Promise<WalrusUploadResponse> {
    const safeEpochs = normalizeWalrusEpochs(epochs);
    const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${safeEpochs}&send_object_to=${userAddress}`;
    let response: Response;
    try {
        response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/octet-stream",
            },
            body: data as unknown as BodyInit,
        });
    } catch (err) {
        console.error("[walrus] upload request failed", {
            url,
            requestedEpochs: epochs,
            safeEpochs,
            payloadBytes: data.byteLength,
            error: err,
        });
        throw err;
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[walrus] upload failed", {
            url,
            requestedEpochs: epochs,
            safeEpochs,
            payloadBytes: data.byteLength,
            status: response.status,
            statusText: response.statusText,
            body: errorText,
        });
        throw new Error(`Walrus upload failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (result.newlyCreated) {
        return {
            blobId: result.newlyCreated.blobObject.blobId,
            isNew: true,
        };
    } else if (result.alreadyCertified) {
        return {
            blobId: result.alreadyCertified.blobId,
            isNew: false,
        };
    }

    throw new Error("Unexpected Walrus response format");
}

export interface MultiUploadEntry {
    data: Uint8Array;
    label?: string;
}

/**
 * Upload multiple blobs in parallel with a concurrency limit.
 * Returns blob IDs in the same order as the input array.
 */
export async function uploadMultipleToWalrus(
    entries: MultiUploadEntry[],
    userAddress: string,
    epochs: number = WALRUS_EPOCHS,
    concurrency: number = DEFAULT_CONCURRENCY,
): Promise<WalrusUploadResponse[]> {
    const results: WalrusUploadResponse[] = new Array(entries.length);
    let cursor = 0;

    async function next(): Promise<void> {
        while (cursor < entries.length) {
            const idx = cursor++;
            results[idx] = await uploadToWalrus(entries[idx].data, userAddress, epochs);
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, entries.length) }, () => next());
    await Promise.all(workers);
    return results;
}

/**
 * Download a blob from Walrus.
 * Returns the raw bytes (still encrypted — decrypt with AES-GCM after Seal DEK recovery).
 */
export async function downloadFromWalrus(
    blobId: string
): Promise<Uint8Array> {
    const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Walrus download failed (${response.status}): ${await response.text()}`
        );
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Download multiple blobs in parallel with a concurrency limit.
 * Returns Uint8Arrays in the same order as the input blob IDs.
 */
export async function downloadMultipleFromWalrus(
    blobIds: string[],
    concurrency: number = DEFAULT_CONCURRENCY,
): Promise<Uint8Array[]> {
    const results: Uint8Array[] = new Array(blobIds.length);
    let cursor = 0;

    async function next(): Promise<void> {
        while (cursor < blobIds.length) {
            const idx = cursor++;
            results[idx] = await downloadFromWalrus(blobIds[idx]);
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, blobIds.length) }, () => next());
    await Promise.all(workers);
    return results;
}

/**
 * Query blob availability on Walrus aggregator.
 * Uses HEAD first, then falls back to GET when HEAD isn't supported.
 */
export async function queryWalrusBlob(blobId: string): Promise<WalrusBlobQueryResult> {
    const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
    let method: "HEAD" | "GET" = "HEAD";
    let response = await fetch(url, { method });

    if (response.status === 405 || response.status === 501) {
        method = "GET";
        response = await fetch(url, { method });
    }

    const result: WalrusBlobQueryResult = {
        blobId,
        url,
        method,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
    };

    if (method === "GET" && response.body) {
        try {
            await response.body.cancel();
        } catch {
            // best-effort cancel, not critical for diagnostics
        }
    }

    return result;
}

/**
 * Build a Walrus aggregator URL for displaying a public blob.
 */
export function getWalrusImageUrl(blobId: string): string {
    return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}

// ============================================================
// Quilt Storage — Upload & Download via dedicated /v1/quilts API
// ============================================================

export interface QuiltFileInput {
    /** Unique identifier for this file within the quilt (used as the form field name). */
    identifier: string;
    /** Raw file bytes to store. */
    data: Uint8Array;
    /** Optional Walrus-native tags for this patch. */
    tags?: Record<string, string>;
}

export interface QuiltPatchInfo {
    identifier: string;
    quiltPatchId: string;
}

export interface WalrusQuiltUploadResponse {
    /** The quilt-level blob ID. */
    quiltBlobId: string;
    /** Per-file patch info (identifier + quiltPatchId). */
    patches: QuiltPatchInfo[];
    isNew: boolean;
}

/**
 * Upload multiple files as a Walrus quilt via `PUT /v1/quilts` (multipart/form-data).
 *
 * Each file becomes a separate patch inside the quilt, addressable by its
 * `quiltPatchId` or by `quiltBlobId + identifier`.
 */
export async function uploadQuiltToWalrus(
    files: QuiltFileInput[],
    userAddress: string,
    epochs: number = WALRUS_EPOCHS,
): Promise<WalrusQuiltUploadResponse> {
    const safeEpochs = normalizeWalrusEpochs(epochs);
    const url = `${WALRUS_PUBLISHER_URL}/v1/quilts?epochs=${safeEpochs}&send_object_to=${userAddress}`;

    const formData = new FormData();
    for (const file of files) {
        formData.append(file.identifier, new Blob([file.data as BlobPart]));
    }

    const filesWithTags = files.filter((f) => f.tags && Object.keys(f.tags).length > 0);
    if (filesWithTags.length > 0) {
        const metadata = filesWithTags.map((f) => ({
            identifier: f.identifier,
            tags: f.tags,
        }));
        formData.append("_metadata", JSON.stringify(metadata));
    }

    let response: Response;
    try {
        response = await fetch(url, { method: "PUT", body: formData });
    } catch (err) {
        console.error("[walrus] quilt upload request failed", {
            url,
            fileCount: files.length,
            error: err,
        });
        throw err;
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[walrus] quilt upload failed", {
            url,
            status: response.status,
            body: errorText,
        });
        throw new Error(`Walrus quilt upload failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("[walrus] quilt upload raw response:", JSON.stringify(result, null, 2));

    // Tolerate both camelCase and snake_case top-level keys
    const blobStoreResult = result.blobStoreResult ?? result.blob_store_result;
    let quiltBlobId: string;
    let isNew: boolean;

    if (blobStoreResult?.newlyCreated) {
        quiltBlobId = blobStoreResult.newlyCreated.blobObject.blobId;
        isNew = true;
    } else if (blobStoreResult?.alreadyCertified) {
        quiltBlobId = blobStoreResult.alreadyCertified.blobId;
        isNew = false;
    } else if (blobStoreResult?.newly_created) {
        quiltBlobId = blobStoreResult.newly_created.blob_object?.blob_id
            ?? blobStoreResult.newly_created.blobObject?.blobId;
        isNew = true;
    } else if (blobStoreResult?.already_certified) {
        quiltBlobId = blobStoreResult.already_certified.blob_id
            ?? blobStoreResult.already_certified.blobId;
        isNew = false;
    } else {
        // Check if it's a flat response (newlyCreated at top level, no blobStoreResult wrapper)
        if (result.newlyCreated) {
            quiltBlobId = result.newlyCreated.blobObject.blobId;
            isNew = true;
        } else if (result.alreadyCertified) {
            quiltBlobId = result.alreadyCertified.blobId;
            isNew = false;
        } else {
            throw new Error(
                `Unexpected Walrus quilt response format. Keys: ${Object.keys(result).join(", ")}`,
            );
        }
    }

    // Tolerate both camelCase and snake_case for the patches array
    const rawPatches: Record<string, unknown>[] =
        result.storedQuiltBlobs
        ?? result.stored_quilt_blobs
        ?? result.storedQuiltPatches
        ?? result.stored_quilt_patches
        ?? [];

    const patches: QuiltPatchInfo[] = rawPatches.map((p) => ({
        identifier: (p.identifier ?? p.Identifier ?? "") as string,
        quiltPatchId: (p.quiltPatchId ?? p.quilt_patch_id ?? p.QuiltPatchId ?? p.patchId ?? p.patch_id ?? "") as string,
    }));

    console.log("[walrus] quilt upload parsed patches:", patches);

    if (patches.length === 0) {
        console.warn(
            "[walrus] quilt upload returned 0 patches. " +
            "Response top-level keys:", Object.keys(result),
        );
    }

    return { quiltBlobId, patches, isNew };
}

/**
 * Download a single quilt patch by its quiltPatchId.
 */
export async function downloadQuiltPatch(quiltPatchId: string): Promise<Uint8Array> {
    const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${quiltPatchId}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Walrus quilt patch download failed (${response.status}): ${await response.text()}`,
        );
    }
    return new Uint8Array(await response.arrayBuffer());
}

/**
 * Download a single quilt patch by quilt blob ID + identifier.
 */
export async function downloadQuiltPatchByIdentifier(
    quiltBlobId: string,
    identifier: string,
): Promise<Uint8Array> {
    const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/by-quilt-id/${quiltBlobId}/${encodeURIComponent(identifier)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Walrus quilt patch download failed (${response.status}): ${await response.text()}`,
        );
    }
    return new Uint8Array(await response.arrayBuffer());
}

/**
 * Download multiple quilt patches in parallel with a concurrency limit.
 */
export async function downloadMultipleQuiltPatches(
    patchIds: string[],
    concurrency: number = DEFAULT_CONCURRENCY,
): Promise<Uint8Array[]> {
    const results: Uint8Array[] = new Array(patchIds.length);
    let cursor = 0;

    async function next(): Promise<void> {
        while (cursor < patchIds.length) {
            const idx = cursor++;
            results[idx] = await downloadQuiltPatch(patchIds[idx]);
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, patchIds.length) }, () => next());
    await Promise.all(workers);
    return results;
}

// ============================================================
// Quilt Patch Listing — query aggregator for patches in a quilt
// ============================================================

export interface QuiltPatchListEntry {
    identifier: string;
    quiltPatchId: string;
}

/**
 * List all patches in a quilt by querying the aggregator.
 * `GET /v1/quilts/{quiltBlobId}/patches`
 *
 * Returns the identifier + quiltPatchId for every patch in the quilt.
 */
export async function listQuiltPatches(quiltBlobId: string): Promise<QuiltPatchListEntry[]> {
    const url = `${WALRUS_AGGREGATOR_URL}/v1/quilts/${quiltBlobId}/patches`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Walrus list quilt patches failed (${response.status}): ${await response.text()}`,
        );
    }
    const data = await response.json();
    console.log("[walrus] listQuiltPatches raw response:", JSON.stringify(data, null, 2));

    const rawArr: Record<string, unknown>[] | null = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>).patches)
            ? (data as Record<string, unknown>).patches as Record<string, unknown>[]
            : null;

    if (!rawArr) {
        throw new Error(
            `Unexpected response format from quilt patches listing. ` +
            `Type: ${typeof data}, keys: ${data && typeof data === "object" ? Object.keys(data).join(", ") : "N/A"}`,
        );
    }

    return rawArr.map((entry) => {
        // Log each raw entry so we can see exactly what field names the aggregator uses
        console.log("[walrus] raw patch entry keys:", Object.keys(entry), "values:", entry);

        const identifier = String(
            entry.identifier ?? entry.Identifier ?? entry.name ?? "",
        );

        // Try every plausible field name for the patch ID
        const patchId = String(
            entry.quiltPatchId
            ?? entry.QuiltPatchId
            ?? entry.quilt_patch_id
            ?? entry.patchId
            ?? entry.PatchId
            ?? entry.patch_id
            ?? entry.id
            ?? entry.Id
            ?? "",
        );

        return { identifier, quiltPatchId: patchId };
    });
}