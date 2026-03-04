import { useState, useCallback } from "react";
import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { createSessionKey, decryptContent } from "@/lib/seal";
import { downloadFromWalrus } from "@/lib/walrus";
import type { SessionKey } from "@mysten/seal";
import { normalizeSuiAddress } from "@mysten/sui/utils";

interface UseDecryptReturn {
  decrypt: (datasetId: string) => Promise<Blob | null>;
  isDecrypting: boolean;
  decryptedData: Blob | null;
  error: string | null;
  reset: () => void;
}

async function aesGcmDecrypt(encrypted: Uint8Array, dek: Uint8Array): Promise<Uint8Array> {
  if (encrypted.byteLength < 13) {
    throw new Error("Encrypted blob is too short");
  }

  const iv = encrypted.slice(0, 12);
  const ciphertext = encrypted.slice(12);
  const key = await crypto.subtle.importKey(
    "raw",
    dek.buffer as ArrayBuffer,
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext.buffer as ArrayBuffer,
  );
  return new Uint8Array(plaintext);
}

export function useDecrypt(): UseDecryptReturn {
  const currentAccount = useCurrentAccount();
  const client = useCurrentClient();
  const { signPersonalMessage } = useDAppKit();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debug = (step: string, meta?: Record<string, unknown>) => {
    console.log("[useDecrypt]", step, meta ?? {});
  };

  const getDatasetFields = useCallback(async (datasetId: string): Promise<any | null> => {
    debug("getDatasetFields:start", { datasetId });
    const object: any = await client.getObject({
      objectId: datasetId,
      include: { json: true },
    });
    const fields = object?.data?.content?.fields ?? object?.object?.json ?? null;
    debug("getDatasetFields:done", {
      datasetId,
      hasFields: Boolean(fields),
      objectKeys: Object.keys(object ?? {}),
    });
    return fields;
  }, [client]);

  const extractBlobIds = (value: any): string[] => {
    const refs = Array.isArray(value)
      ? value
      : Array.isArray(value?.contents)
        ? value.contents
        : Array.isArray(value?.fields?.contents)
          ? value.fields.contents
          : [];

    return refs
      .map((entry: any) => {
        if (typeof entry === "string") return entry;
        if (typeof entry?.name === "string") return entry.name;
        if (typeof entry?.value === "string") return entry.value;
        if (typeof entry?.fields?.name === "string") return entry.fields.name;
        if (typeof entry?.fields?.value === "string") return entry.fields.value;
        return null;
      })
      .filter((id: string | null): id is string => Boolean(id));
  };

  const toBytes = (value: any): Uint8Array => {
    const decodeHex = (hex: string): Uint8Array => {
      const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
      if (clean.length % 2 !== 0) {
        throw new Error("Invalid hex bytes length");
      }
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
      }
      return bytes;
    };
    const decodeBase64 = (encoded: string): Uint8Array => {
      const bin = atob(encoded);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) {
        bytes[i] = bin.charCodeAt(i);
      }
      return bytes;
    };

    if (value instanceof Uint8Array) return value;
    if (Array.isArray(value)) return new Uint8Array(value);
    if (typeof value === "string") {
      if (value.startsWith("0x")) return decodeHex(value);
      return decodeBase64(value);
    }
    if (Array.isArray(value?.bytes)) return new Uint8Array(value.bytes);
    if (typeof value?.bytes === "string") {
      if (value.bytes.startsWith("0x")) return decodeHex(value.bytes);
      return decodeBase64(value.bytes);
    }
    if (Array.isArray(value?.data)) return new Uint8Array(value.data);
    if (Array.isArray(value?.fields?.bytes)) return new Uint8Array(value.fields.bytes);
    if (typeof value?.fields?.bytes === "string") {
      if (value.fields.bytes.startsWith("0x")) return decodeHex(value.fields.bytes);
      return decodeBase64(value.fields.bytes);
    }
    if (Array.isArray(value?.fields?.data)) return new Uint8Array(value.fields.data);
    throw new Error("Invalid encrypted envelope format");
  };

  const createSignedSessionKey = useCallback(async (): Promise<SessionKey> => {
    const getSignaturePayload = (result: any): any => {
      if (typeof result === "string") return result;
      if (result?.signature !== undefined) return result.signature;
      if (result?.result?.signature !== undefined) return result.result.signature;
      throw new Error("Wallet did not return a personal message signature payload");
    };

    if (!currentAccount) {
      throw new Error("No wallet connected");
    }
    const normalizedAddress = normalizeSuiAddress(currentAccount.address);
    debug("session:create:start", { address: currentAccount.address, normalizedAddress });

    const sessionKey = await createSessionKey(
      normalizedAddress,
      client,
      10,
    );
    debug("session:create:done", {
      packageId: sessionKey.getPackageId(),
      isExpired: sessionKey.isExpired(),
      personalMessageBytes: sessionKey.getPersonalMessage().length,
    });
    const signed = await signPersonalMessage({
      message: sessionKey.getPersonalMessage(),
    });
    debug("session:walletSign:done", {
      resultType: typeof signed,
      topLevelKeys: signed && typeof signed === "object" ? Object.keys(signed) : [],
      signatureType:
        signed && typeof signed === "object"
          ? typeof (signed as any).signature
          : undefined,
    });
    const signaturePayload = getSignaturePayload(signed);
    debug("session:signaturePayload", {
      payloadType: typeof signaturePayload,
      payloadKeys:
        signaturePayload && typeof signaturePayload === "object"
          ? Object.keys(signaturePayload)
          : [],
    });
    await sessionKey.setPersonalMessageSignature(signaturePayload);
    debug("session:setSignature:done");
    return sessionKey;
  }, [client, currentAccount, signPersonalMessage]);

  const decrypt = useCallback(async (datasetId: string): Promise<Blob | null> => {
    setIsDecrypting(true);
    setError(null);
    debug("decrypt:start", { datasetId });

    try {
      const fields = await getDatasetFields(datasetId);
      if (!fields) {
        throw new Error(`Dataset not found: ${datasetId}`);
      }

      const blobIds = extractBlobIds(fields.blob_ids);
      if (blobIds.length === 0) {
        throw new Error("Dataset has no blob IDs");
      }
      debug("decrypt:blobIds", {
        count: blobIds.length,
        firstBlobId: blobIds[0],
      });

      const envelope = fields.envelope;
      debug("decrypt:envelopeShape", {
        envelopeKeys: envelope && typeof envelope === "object" ? Object.keys(envelope) : [],
        encryptedKeyType: typeof envelope?.encrypted_key,
        versionRaw: envelope?.version,
      });
      const encryptedEnvelope = toBytes(envelope?.encrypted_key);
      const version = Number(envelope?.version ?? 0);
      debug("decrypt:envelopeParsed", {
        encryptedEnvelopeBytes: encryptedEnvelope.byteLength,
        version,
      });

      const encryptedBlob = await downloadFromWalrus(blobIds[0]);
      debug("decrypt:blobDownloaded", { encryptedBlobBytes: encryptedBlob.byteLength });
      const sessionKey = await createSignedSessionKey();
      const dek = await decryptContent(
        client,
        encryptedEnvelope,
        datasetId,
        version,
        sessionKey,
      );
      debug("decrypt:dekDecrypted", { dekBytes: dek.byteLength });
      const plaintext = await aesGcmDecrypt(encryptedBlob, dek);
      debug("decrypt:blobDecrypted", { plaintextBytes: plaintext.byteLength });

      const plaintextBuffer = plaintext.buffer.slice(
        plaintext.byteOffset,
        plaintext.byteOffset + plaintext.byteLength,
      ) as ArrayBuffer;
      const decryptedBlob = new Blob([plaintextBuffer], {
        type: "application/octet-stream",
      });

      setDecryptedData(decryptedBlob);
      debug("decrypt:done", { blobSize: decryptedBlob.size });
      return decryptedBlob;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Decryption failed";
      debug("decrypt:error", {
        message,
        name: err instanceof Error ? err.name : "UnknownError",
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(message);
      return null;
    } finally {
      setIsDecrypting(false);
    }
  }, [client, createSignedSessionKey, getDatasetFields]);

  const reset = useCallback(() => {
    setIsDecrypting(false);
    setDecryptedData(null);
    setError(null);
  }, []);

  return { decrypt, isDecrypting, decryptedData, error, reset };
}
