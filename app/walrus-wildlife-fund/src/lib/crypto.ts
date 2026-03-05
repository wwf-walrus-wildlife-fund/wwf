/**
 * AES-256-GCM envelope encryption primitives using the Web Crypto API.
 *
 * Wire format per encrypted file: [IV (12 bytes)] [ciphertext + authTag]
 * The 16-byte GCM auth tag is appended automatically by SubtleCrypto.
 */

const AES_KEY_BYTES = 32;
const IV_BYTES = 12;
const ALGO = "AES-GCM";

export async function generateDEK(): Promise<Uint8Array> {
    const raw = crypto.getRandomValues(new Uint8Array(AES_KEY_BYTES));
    return raw;
}

async function importDEK(raw: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
        { name: ALGO },
        false,
        ["encrypt", "decrypt"],
    );
}

/**
 * Encrypt plaintext with a DEK.
 * Returns `IV (12 B) || ciphertext || authTag (16 B)`.
 */
export async function encryptFile(
    dek: Uint8Array,
    plaintext: Uint8Array,
): Promise<Uint8Array> {
    const key = await importDEK(dek);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const cipherBuf = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        plaintext.buffer.slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength) as ArrayBuffer,
    );
    const cipher = new Uint8Array(cipherBuf);
    const out = new Uint8Array(IV_BYTES + cipher.byteLength);
    out.set(iv, 0);
    out.set(cipher, IV_BYTES);
    return out;
}

/**
 * Decrypt a buffer produced by `encryptFile`.
 */
export async function decryptFile(
    dek: Uint8Array,
    encrypted: Uint8Array,
): Promise<Uint8Array> {
    const key = await importDEK(dek);
    const iv = encrypted.slice(0, IV_BYTES);
    const ciphertext = encrypted.slice(IV_BYTES);
    const plainBuf = await crypto.subtle.decrypt(
        { name: ALGO, iv },
        key,
        ciphertext,
    );
    return new Uint8Array(plainBuf);
}
