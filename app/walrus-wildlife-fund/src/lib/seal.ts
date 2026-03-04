import { SealClient, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

const SEAL_KEY_SERVER_OBJECT_IDS = [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
];
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
        sealClientInstance = new SealClient({
            suiClient,
            serverConfigs: SEAL_KEY_SERVER_OBJECT_IDS.map((id) => ({
                objectId: id,
                weight: 1,
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
    suiClient: AnySuiClient,
    ttlMin: number = 10
): Promise<SessionKey> {
    const sessionKey = await SessionKey.create({
        address: suiAddress,
        packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
        ttlMin,
        suiClient,
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
            tx.object("0x6"), // Clock
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