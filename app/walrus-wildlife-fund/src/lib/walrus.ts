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

/**
 * Upload encrypted data to Walrus.
 * The data should already be encrypted with Seal before uploading.
 */
export async function uploadToWalrus(
    data: Uint8Array,
    epochs: number = WALRUS_EPOCHS
): Promise<WalrusUploadResponse> {
    const safeEpochs = normalizeWalrusEpochs(epochs);
    const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${safeEpochs}`;
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
    console.info("[walrus] upload response", {
        url,
        requestedEpochs: epochs,
        safeEpochs,
        status: response.status,
        response: result,
    });

    if (result.newlyCreated) {
        const uploaded = {
            blobId: result.newlyCreated.blobObject.blobId,
            isNew: true,
        };
        console.info("[walrus] upload success", {
            ...uploaded,
            queryUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/${uploaded.blobId}`,
        });
        return {
            blobId: uploaded.blobId,
            isNew: uploaded.isNew,
        };
    } else if (result.alreadyCertified) {
        const uploaded = {
            blobId: result.alreadyCertified.blobId,
            isNew: false,
        };
        console.info("[walrus] upload success", {
            ...uploaded,
            queryUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/${uploaded.blobId}`,
        });
        return {
            blobId: uploaded.blobId,
            isNew: uploaded.isNew,
        };
    }

    throw new Error("Unexpected Walrus response format");
}

/**
 * Download a blob from Walrus.
 * Returns the raw bytes (still encrypted — decrypt with Seal after download).
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
 * Upload already-encrypted data to Walrus and return the blob ID.
 */
export async function uploadEncryptedContent(
    encryptedData: Uint8Array
): Promise<string> {
    const result = await uploadToWalrus(encryptedData);
    return result.blobId;
}

// ============================================================
// Public image upload (avatars, banners — NOT encrypted)
// ============================================================

/**
 * Upload a public image file to Walrus (no encryption).
 * Returns the Walrus blob ID.
 */
export async function uploadPublicImage(file: File): Promise<string> {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const result = await uploadToWalrus(buffer);
    return result.blobId;
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

    console.info("[walrus] blob query result", result);
    return result;
}

/**
 * Build a Walrus aggregator URL for displaying a public blob.
 */
export function getWalrusImageUrl(blobId: string): string {
    return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}