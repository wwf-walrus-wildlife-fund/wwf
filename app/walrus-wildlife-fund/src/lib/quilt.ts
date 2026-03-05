/**
 * Re-exports quilt types and helpers from walrus.ts.
 *
 * The quilt upload/download logic uses the dedicated Walrus HTTP
 * `/v1/quilts` API (multipart form) instead of client-side encoding.
 * All quilt functions now live in `@/lib/walrus`.
 */
export {
    type QuiltFileInput,
    type QuiltPatchInfo,
    type WalrusQuiltUploadResponse,
    uploadQuiltToWalrus,
    downloadQuiltPatch,
    downloadQuiltPatchByIdentifier,
    downloadMultipleQuiltPatches,
} from "./walrus";
