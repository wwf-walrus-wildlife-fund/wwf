import { SealClient, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

const DEFAULT_SEAL_KEY_SERVER_OBJECT_IDS = [
    // Overclock (open, testnet)
    "0x9c949e53c36ab7a9c484ed9e8b43267a77d4b8d70e79aa6b39042e3d4c434105",
    // H2O Nodes (open, testnet)
    "0x39cef09b24b667bc6ed54f7159d82352fe2d5dd97ca9a5beaa1d21aa774f25a2",
];

function getSealKeyServerObjectIds(): string[] {
    const fromEnv = process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_OBJECT_IDS;
    if (!fromEnv) return DEFAULT_SEAL_KEY_SERVER_OBJECT_IDS;
    const parsed = fromEnv
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : DEFAULT_SEAL_KEY_SERVER_OBJECT_IDS;
}
export const SEAL_THRESHOLD = 1;

// ============================================================
// Internal Types
// ============================================================

/** SUI client abstraction (avoids coupling to a specific import) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySuiClient = any;

/** Convert a hex string to a number array (for tx.pure.vector) */
function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
}

/** Convert a byte array to its lowercase hex representation */
function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// ============================================================
// SealClient Singleton
// ============================================================

let sealClientInstance: SealClient | null = null;

/**
 * Get or create a SealClient instance.
 */
export function getSealClient(suiClient: AnySuiClient): SealClient {
    if (!sealClientInstance) {
        const keyServerObjectIds = getSealKeyServerObjectIds();
        const sealApiKey = process.env.NEXT_PUBLIC_SEAL_API_KEY;
        const sealApiKeyName = process.env.NEXT_PUBLIC_SEAL_API_KEY_NAME ?? "x-api-key";
        const authConfig = sealApiKey
            ? { apiKeyName: sealApiKeyName, apiKey: sealApiKey }
            : {};

        console.info("[seal] initializing client", {
            keyServers: keyServerObjectIds,
            hasApiKey: Boolean(sealApiKey),
            apiKeyName: sealApiKey ? sealApiKeyName : null,
        });

        sealClientInstance = new SealClient({
            suiClient,
            serverConfigs: keyServerObjectIds.map((id) => ({
                objectId: id,
                weight: 1,
                ...authConfig,
            })),
            verifyKeyServers: false,
        });
    }
    return sealClientInstance;
}

// ============================================================
// Seal Identity Construction
// ============================================================

/**
 * Build the Seal identity bytes from a Service object ID and Post ID.
 * Format: [ServiceAddress (32 bytes)][PostId (8 bytes, little-endian)]
 */
export function buildSealId(serviceObjectId: string, postId: string | number): string {
    const serviceAddr = serviceObjectId.startsWith("0x") ? serviceObjectId : `0x${serviceObjectId}`;
    const serviceBytes = bcs.Address.serialize(serviceAddr).toBytes();
    const postBytes = bcs.u64().serialize(postId).toBytes();

    const combined = new Uint8Array(serviceBytes.length + postBytes.length);
    combined.set(serviceBytes);
    combined.set(postBytes, serviceBytes.length);

    return toHex(combined);
}

// ============================================================
// Encryption
// ============================================================

/**
 * Encrypt content using Seal.
 */
export async function encryptContent(
    suiClient: AnySuiClient,
    data: Uint8Array,
    serviceObjectId: string,
    postId: string | number
): Promise<{ encryptedBytes: Uint8Array; backupKey: Uint8Array }> {
    const sealClient = getSealClient(suiClient);
    const id = buildSealId(serviceObjectId, postId);

    const result = await sealClient.encrypt({
        threshold: SEAL_THRESHOLD,
        packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
        id,
        data,
    });

    return {
        encryptedBytes: result.encryptedObject as Uint8Array,
        backupKey: result.key as Uint8Array,
    };
}

// ============================================================
// Session Key Management
// ============================================================

/**
 * Create a Seal session key for decryption.
 */
export async function createSessionKey(
    suiAddress: string,
    _suiClient: AnySuiClient,
    ttlMin: number = 10
): Promise<SessionKey> {
    // SessionKey signature verification is JSON-RPC based.
    // Use SuiJsonRpcClient here to avoid transport-specific verification failures.
    const sessionClient = new SuiJsonRpcClient({
        url: getJsonRpcFullnodeUrl("testnet"),
        network: "testnet",
    });
    const sessionKey = await SessionKey.create({
        address: suiAddress,
        packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
        ttlMin,
        suiClient: sessionClient,
    });

    return sessionKey;
}

// ============================================================
// Decryption
// ============================================================

/**
 * Build the PTB for Seal decryption (key servers dry-run this to verify access).
 */
export async function buildDecryptionTx(
    serviceObjectId: string,
    postId: string | number,
    suiClient: AnySuiClient
): Promise<Uint8Array> {
    const idHex = buildSealId(serviceObjectId, postId);
    const idBytes = hexToBytes(idHex);

    const tx = new Transaction();
    tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID!}::seal_approve_reader::seal_approve_reader`,
        arguments: [
            tx.pure.vector("u8", idBytes),
            tx.object(serviceObjectId),
        ],
    });

    const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
    });

    return txBytes as Uint8Array;
}

/**
 * Decrypt content using Seal.
 */
export async function decryptContent(
    suiClient: AnySuiClient,
    encryptedData: Uint8Array,
    serviceObjectId: string,
    postId: string | number,
    sessionKey: SessionKey
): Promise<Uint8Array> {
    const sealClient = getSealClient(suiClient);
    const txBytes = await buildDecryptionTx(serviceObjectId, postId, suiClient);

    const decryptedBytes = await sealClient.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
    });

    return decryptedBytes as Uint8Array;
}