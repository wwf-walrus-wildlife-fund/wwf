import { useState, useEffect, useCallback } from "react";
import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID, normalizeSuiAddress } from "@mysten/sui/utils";
import type { SessionKey } from "@mysten/seal";
import type { Dataset, DecryptedFile } from "@/lib/types";
import { extractFields, toUiDataset, canRead, isEnvelopeEncrypted } from "@/lib/sui-helpers";
import { createSessionKey, decryptDEK, decryptContent } from "@/lib/seal";
import { downloadFromWalrus, downloadMultipleFromWalrus } from "@/lib/walrus";
import { decryptFile } from "@/lib/crypto";
import { sliceQuiltPatch } from "@/lib/quilt";
import { fromBase64 } from "@mysten/sui/utils";

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

function parseVectorU8(raw: unknown): Uint8Array {
  if (raw instanceof Uint8Array) return raw;
  if (Array.isArray(raw)) return new Uint8Array(raw);
  if (typeof raw === "string" && raw.length > 0) {
    if (raw.startsWith("0x")) {
      return new Uint8Array(raw.slice(2).match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
    }
    // SUI JSON serialization returns vector<u8> as base64
    return fromBase64(raw);
  }
  throw new Error("Cannot parse vector<u8> field");
}

interface UseDatasetReturn {
  dataset: Dataset | null;
  isLoading: boolean;
  hasBought: boolean;
  isChecking: boolean;
  recheck: () => Promise<void>;
  buy: () => Promise<boolean>;
  isBuying: boolean;
  buyError: string | null;
  decrypt: () => Promise<DecryptedFile[] | null>;
  isDecrypting: boolean;
  decryptedFiles: DecryptedFile[] | null;
  decryptError: string | null;
  resetDecrypt: () => void;
}

export function useDataset(id: string): UseDatasetReturn {
  const currentAccount = useCurrentAccount();
  const client = useCurrentClient();
  const { signAndExecuteTransaction, signPersonalMessage } = useDAppKit();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [hasBought, setHasBought] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedFiles, setDecryptedFiles] = useState<DecryptedFile[] | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // ── Fetch dataset object ──────────────────────────────────
  useEffect(() => {
    const fetchDataset = async () => {
      setIsLoading(true);
      try {
        const object = await client.getObject({
          objectId: id,
          include: { json: true, owner: true },
        });
        const fields = extractFields(object);
        if (!fields) {
          setDataset(null);
          return;
        }
        setDataset(toUiDataset(id, fields));
      } catch {
        setDataset(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDataset();
  }, [client, id]);

  // ── Check ownership / read access ────────────────────────
  const checkAccess = useCallback(async () => {
    if (!currentAccount?.address) {
      setHasBought(false);
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    try {
      const hasAccess = await canRead(id, currentAccount.address, client);
      setHasBought(hasAccess);
    } catch {
      setHasBought(false);
    } finally {
      setIsChecking(false);
    }
  }, [currentAccount?.address, client, id]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // ── Buy ───────────────────────────────────────────────────
  const buy = useCallback(async (): Promise<boolean> => {
    setIsBuying(true);
    setBuyError(null);
    try {
      if (!currentAccount) throw new Error("No wallet connected");
      const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
      if (!packageId) throw new Error("Missing NEXT_PUBLIC_PACKAGE_ID");

      const datasetObject = await client.getObject({
        objectId: id,
        include: { json: true },
      });
      const fields = datasetObject.object.json;
      if (!fields) throw new Error(`Dataset object not found: ${id}`);

      const priceMist = BigInt(fields!.price_sui as string);
      const namespaceId = fields.derivation_id as string;
      if (!namespaceId) throw new Error("Dataset derivation namespace is missing");

      const accountId = deriveObjectID(
        namespaceId,
        `${packageId}::account::AccountTag`,
        bcs.Address.serialize(currentAccount.address).toBytes(),
      );
      const accountObject = await client
        .getObject({ objectId: accountId, include: { json: true } })
        .catch(() => null);
      const accountExists = Boolean(accountObject?.object?.json);

      const tx = new Transaction();
      let newAccount;
      if (!accountExists) {
        newAccount = tx.moveCall({
          target: `${packageId}::account::new`,
          arguments: [tx.object(namespaceId)],
        });
      }

      const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);
      tx.moveCall({
        target: `${packageId}::dataset::pay_sui_to_read`,
        arguments: [
          tx.object(id),
          paymentCoin,
          newAccount ? newAccount : tx.object(accountId),
        ],
      });

      if (!accountExists && newAccount) {
        tx.moveCall({
          target: `${packageId}::account::share`,
          arguments: [newAccount],
        });
      }

      await signAndExecuteTransaction({ transaction: tx });
      return true;
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : "Purchase failed");
      return false;
    } finally {
      setIsBuying(false);
    }
  }, [client, currentAccount, id, signAndExecuteTransaction]);

  // ── Session key helper ────────────────────────────────────
  const createSignedSessionKey = useCallback(async (): Promise<SessionKey> => {
    if (!currentAccount) throw new Error("No wallet connected");
    const sessionKey = await createSessionKey(
      normalizeSuiAddress(currentAccount.address),
      client,
      10,
    );
    const signResult = await signPersonalMessage({
      message: sessionKey.getPersonalMessage(),
    });
    const signResultAny = signResult as any;
    const signaturePayload =
      typeof signResult === "string"
        ? signResult
        : signResultAny?.signature ?? signResultAny?.result?.signature;
    if (!signaturePayload) {
      throw new Error("Wallet did not return a personal message signature");
    }
    await sessionKey.setPersonalMessageSignature(signaturePayload);
    return sessionKey;
  }, [client, currentAccount, signPersonalMessage]);

  // ── Decrypt (envelope or legacy) ──────────────────────────
  const decrypt = useCallback(async (): Promise<DecryptedFile[] | null> => {
    setIsDecrypting(true);
    setDecryptError(null);
    try {
      const fields = extractFields(
        await client.getObject({ objectId: id, include: { json: true } }),
      );
      if (!fields) throw new Error(`Dataset not found: ${id}`);

      if (!currentAccount?.address) throw new Error("No wallet connected");
      const hasAccess = await canRead(id, currentAccount.address, client);
      if (!hasAccess) throw new Error("You do not have read access to this dataset");

      const blobIds = dataset?.blob_ids ?? [];
      if (blobIds.length === 0) throw new Error("Dataset has no blob IDs");

      const version = Number(fields?.envelope?.version ?? 0);
      if (!Number.isFinite(version)) throw new Error("Invalid envelope version on dataset");

      const sessionKey = await createSignedSessionKey();

      // Detect envelope encryption vs legacy
      const dsSnapshot = dataset ? { ...dataset, ...toUiDataset(id, fields) } : toUiDataset(id, fields);

      if (isEnvelopeEncrypted(dsSnapshot)) {
        // ── Envelope encryption path ──
        // 1. Extract Seal-encrypted DEK from on-chain envelope
        const encryptedKeyRaw = fields.envelope?.encrypted_key ?? fields.envelope?.fields?.encrypted_key;
        const encryptedKey = parseVectorU8(encryptedKeyRaw);

        // 2. Seal-decrypt the DEK
        const dek = await decryptDEK(client, encryptedKey, id, version, sessionKey);

        // 3. Fetch encrypted blob(s)
        const manifest = dsSnapshot.fileManifest;

        if (manifest?.storageType === "quilt") {
          // Quilt path: single blob, slice by manifest offsets
          const quiltBlob = await downloadFromWalrus(blobIds[0]);
          const files: DecryptedFile[] = await Promise.all(
            manifest.files.map(async (entry) => {
              const patch = sliceQuiltPatch(quiltBlob, entry.patchOffset!, entry.patchOffset! + entry.patchLength!);
              const plaintext = await decryptFile(dek, patch);
              return {
                name: entry.name,
                mimeType: entry.mimeType,
                data: new Blob([toArrayBuffer(plaintext)], { type: entry.mimeType }),
              };
            }),
          );
          setDecryptedFiles(files);
          return files;
        } else {
          // Blobs path: one blob per file
          const encryptedBlobs = await downloadMultipleFromWalrus(blobIds);
          const files: DecryptedFile[] = await Promise.all(
            encryptedBlobs.map(async (encBlob, i) => {
              const plaintext = await decryptFile(dek, encBlob);
              const entry = manifest?.files[i];
              const mime = entry?.mimeType ?? "application/octet-stream";
              return {
                name: entry?.name ?? `file_${i}`,
                mimeType: mime,
                data: new Blob([toArrayBuffer(plaintext)], { type: mime }),
              };
            }),
          );
          setDecryptedFiles(files);
          return files;
        }
      } else {
        // ── Legacy path: Seal-encrypted blob (backward compat) ──
        const encryptedBlob = await downloadFromWalrus(blobIds[0]);
        const plaintext = await decryptContent(client, encryptedBlob, id, version, sessionKey);

        const plaintextBuffer = plaintext.buffer.slice(
          plaintext.byteOffset,
          plaintext.byteOffset + plaintext.byteLength,
        ) as ArrayBuffer;
        const file: DecryptedFile = {
          name: dataset?.name ?? "dataset",
          mimeType: "application/octet-stream",
          data: new Blob([plaintextBuffer], { type: "application/octet-stream" }),
        };
        setDecryptedFiles([file]);
        return [file];
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Decryption failed";
      const message = rawMessage.includes("Not enough shares")
        ? "Seal could not recover enough key shares. This usually means access is denied, identity/version does not match, or the blob was not encrypted with this Seal identity."
        : rawMessage;
      setDecryptError(message);
      return null;
    } finally {
      setIsDecrypting(false);
    }
  }, [client, createSignedSessionKey, currentAccount?.address, dataset, id]);

  const resetDecrypt = useCallback(() => {
    setIsDecrypting(false);
    setDecryptedFiles(null);
    setDecryptError(null);
  }, []);

  return {
    dataset,
    isLoading,
    hasBought,
    isChecking,
    recheck: checkAccess,
    buy,
    isBuying,
    buyError,
    decrypt,
    isDecrypting,
    decryptedFiles,
    decryptError,
    resetDecrypt,
  };
}
