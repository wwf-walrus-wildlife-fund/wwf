/**
 * Quilt encoding helper — bundles multiple encrypted files into a single
 * Walrus blob using the @mysten/walrus SDK's `encodeQuilt`.
 *
 * The encoded quilt is then uploaded via the normal HTTP publisher,
 * and the patch index is stored on-chain so the client can slice
 * individual files out of the downloaded blob.
 */

import type { ClientWithCoreApi } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";

export interface QuiltFileInput {
    identifier: string;
    contents: Uint8Array;
    tags?: Record<string, string>;
}

export interface QuiltPatch {
    identifier: string;
    startIndex: number;
    endIndex: number;
}

export interface QuiltEncodeResult {
    /** The quilt blob bytes ready for upload. */
    quiltBytes: Uint8Array;
    /** Per-file patch index (byte offsets within the quilt blob). */
    patches: QuiltPatch[];
}

let _walrusClient: WalrusClient | null = null;

function getWalrusClient(suiClient: ClientWithCoreApi): WalrusClient {
    if (!_walrusClient) {
        _walrusClient = new WalrusClient({
            network: "testnet",
            suiClient,
        });
    }
    return _walrusClient;
}

/**
 * Encode multiple encrypted file buffers into a single quilt blob.
 *
 * The returned `quiltBytes` should be uploaded via the HTTP publisher
 * like any other blob. The `patches` array records byte offsets so
 * individual files can be sliced from the downloaded quilt later.
 */
export async function encodeQuiltFromFiles(
    suiClient: ClientWithCoreApi,
    files: QuiltFileInput[],
): Promise<QuiltEncodeResult> {
    const client = getWalrusClient(suiClient);
    const { quilt, index } = await client.encodeQuilt({
        blobs: files.map((f) => ({
            identifier: f.identifier,
            contents: f.contents,
            tags: f.tags,
        })),
    });

    return {
        quiltBytes: quilt,
        patches: index.patches.map((p) => ({
            identifier: p.identifier,
            startIndex: p.startIndex,
            endIndex: p.endIndex,
        })),
    };
}

/**
 * Extract a single file's bytes from a downloaded quilt blob
 * using the stored patch offset.
 */
export function sliceQuiltPatch(
    quiltBlob: Uint8Array,
    startIndex: number,
    endIndex: number,
): Uint8Array {
    return quiltBlob.slice(startIndex, endIndex);
}
