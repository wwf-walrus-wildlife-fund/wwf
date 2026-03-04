import { useState, useCallback } from "react";
import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import type { SessionKey } from "@mysten/seal";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { createSessionKey, decryptContent } from "@/lib/seal";
import { downloadFromWalrus } from "@/lib/walrus";
import { canRead } from "@/hooks/useRead";

interface UseDecryptReturn {
    decrypt: (datasetId: string) => Promise<Blob | null>;
    isDecrypting: boolean;
    decryptedData: Blob | null;
    error: string | null;
    reset: () => void;
}

export function useDecrypt(): UseDecryptReturn {
    const currentAccount = useCurrentAccount();
    const client = useCurrentClient();
    const { signPersonalMessage } = useDAppKit();
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptedData, setDecryptedData] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getDatasetFields = useCallback(async (datasetId: string): Promise<any> => {
        const object: any = await client.getObject({
            objectId: datasetId,
            include: { json: true },
        });

        const fields = object?.data?.content?.fields ?? object?.object?.json;
        if (!fields) {
            throw new Error(`Dataset not found: ${datasetId}`);
        }
        return fields;
    }, [client]);

    const parseBlobIds = (blobIdsRaw: any): string[] => {
        const entries = Array.isArray(blobIdsRaw)
            ? blobIdsRaw
            : Array.isArray(blobIdsRaw?.contents)
                ? blobIdsRaw.contents
                : Array.isArray(blobIdsRaw?.fields?.contents)
                    ? blobIdsRaw.fields.contents
                    : [];

        return entries
            .map((entry: any) => {
                if (typeof entry === "string") return entry;
                if (typeof entry?.name === "string") return entry.name;
                if (typeof entry?.fields?.name === "string") return entry.fields.name;
                return null;
            })
            .filter((value: string | null): value is string => Boolean(value));
    };

    const createSignedSessionKey = useCallback(async (): Promise<SessionKey> => {
        if (!currentAccount) {
            throw new Error("No wallet connected");
        }

        const sessionKey = await createSessionKey(
            normalizeSuiAddress(currentAccount.address),
            client,
            10
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

    const decrypt = useCallback(async (datasetId: string): Promise<Blob | null> => {
        setIsDecrypting(true);
        setError(null);

        try {
            // 1) Read on-chain dataset metadata.
            const fields = await getDatasetFields(datasetId);

            // 2) Ensure caller has reader access before asking Seal.
            if (!currentAccount?.address) {
                throw new Error("No wallet connected");
            }
            const hasAccess = await canRead(datasetId, currentAccount.address, client);
            if (!hasAccess) {
                throw new Error("You do not have read access to this dataset");
            }

            // 3) Extract blob ID + seal identity version.
            const blobIds = parseBlobIds(fields.blob_ids);
            if (blobIds.length === 0) {
                throw new Error("Dataset has no blob IDs");
            }
            const version = Number(fields?.envelope?.version ?? 0);
            if (!Number.isFinite(version)) {
                throw new Error("Invalid envelope version on dataset");
            }

            // 4) Download encrypted blob from Walrus.
            const encryptedBlob = await downloadFromWalrus(blobIds[0]);

            // 5) Create SessionKey and sign personal message with wallet.
            const sessionKey = await createSignedSessionKey();

            // 6) Decrypt full blob with Seal.
            const plaintext = await decryptContent(
                client,
                encryptedBlob,
                datasetId,
                version,
                sessionKey
            );
            const plaintextBuffer = plaintext.buffer.slice(
                plaintext.byteOffset,
                plaintext.byteOffset + plaintext.byteLength
            ) as ArrayBuffer;
            const blob = new Blob([plaintextBuffer], {
                type: "application/octet-stream",
            });

            setDecryptedData(blob);
            return blob;
        } catch (err) {
            const rawMessage = err instanceof Error ? err.message : "Decryption failed";
            const message = rawMessage.includes("Not enough shares")
                ? "Seal could not recover enough key shares. This usually means access is denied, identity/version does not match, or the blob was not encrypted with this Seal identity."
                : rawMessage;
            setError(message);
            return null;
        } finally {
            setIsDecrypting(false);
        }
    }, [client, createSignedSessionKey, currentAccount?.address, getDatasetFields]);

    const reset = useCallback(() => {
        setIsDecrypting(false);
        setDecryptedData(null);
        setError(null);
    }, []);

    return { decrypt, isDecrypting, decryptedData, error, reset };
}
