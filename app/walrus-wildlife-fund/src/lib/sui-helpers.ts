import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";
import type { Dataset, FileManifest } from "./types";

type AnySuiClient = any;

export function extractFields(obj: any): any | null {
  return  obj?.object?.json ?? null;
}

function refToId(value: any): string | null {
  if (typeof value === "string") return value;
  if (typeof value?.id === "string") return value.id;
  if (typeof value?.objectId === "string") return value.objectId;
  return null;
}

export function extractIdList(value: any): string[] {
  const refs = Array.isArray(value)
    ? value
    : Array.isArray(value?.contents)
      ? value.contents
      : Array.isArray(value?.fields?.contents)
        ? value.fields.contents
        : [];

  return refs
    .map(refToId)
    .filter((id: string | null): id is string => Boolean(id));
}

export function parseBlobIds(blobIdsRaw: any): string[] {
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
}

function parseFileManifest(raw: unknown): FileManifest | undefined {
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.files)) {
      return parsed as FileManifest;
    }
  } catch {
    // malformed manifest — treat as legacy
  }
  return undefined;
}

function extractEnvelopeKeyLength(envelope: any): number {
  const key = envelope?.encrypted_key ?? envelope?.fields?.encrypted_key;
  if (Array.isArray(key)) return key.length;
  if (key instanceof Uint8Array) return key.byteLength;
  if (typeof key === "string") return key.length > 0 ? 1 : 0;
  return 0;
}

export function toUiDataset(objectId: string, fields: any): Dataset {
  const priceMist = Number(fields?.price_sui ?? 0);
  const priceSui = Number.isFinite(priceMist)
    ? (priceMist / 1_000_000_000).toString()
    : "0";

  const manifest = parseFileManifest(fields?.file_manifest);
  const envelopeKeyLen = extractEnvelopeKeyLength(fields?.envelope);

  return {
    id: objectId,
    name: String(fields?.name ?? "Untitled Dataset"),
    description: String(fields?.description ?? ""),
    category: String(fields?.project ?? "Other"),
    price: priceSui,
    seller: String(fields?.funds_receiver ?? ""),
    imageUrl: String(fields?.image_url ?? ""),
    projectUrl: String(fields?.project_url ?? ""),
    size: "N/A",
    format: "Encrypted",
    downloads: 0,
    expiresIn: "N/A",
    verified: false,
    blob_ids: parseBlobIds(fields?.blob_ids),
    fileManifest: manifest,
    envelopeVersion: Number(fields?.envelope?.version ?? fields?.envelope?.fields?.version ?? 0),
    envelopeKeyLength: envelopeKeyLen,
  };
}

/**
 * Returns true when the dataset uses envelope encryption (DEK pattern).
 * Legacy datasets have an empty encrypted_key.
 */
export function isEnvelopeEncrypted(dataset: Dataset): boolean {
  return (dataset.envelopeKeyLength ?? 0) > 0;
}

/**
 * Fetch a Sui object using whichever client API shape is available.
 */
export async function getObjectBySdk(
  suiClient: AnySuiClient,
  id: string,
): Promise<any> {
  return suiClient.getObject({
    objectId: id,
    include: { json: true, owner: true },
  });
}

/**
 * Check whether `account` has read access to `datasetId`.
 */
export async function canRead(
  datasetId: string,
  account: string,
  suiClient: AnySuiClient,
): Promise<boolean> {
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  const platformObjectId = process.env.NEXT_PUBLIC_PLATFORM_OBJECT_ID;
  if (!packageId || !platformObjectId) return false;

  const accountObjectId = deriveObjectID(
    platformObjectId,
    `${packageId}::account::AccountTag`,
    bcs.Address.serialize(account).toBytes(),
  );

  let accountObject;
  try {
    accountObject = await suiClient.getObject({
      objectId: accountObjectId,
      include: { json: true },
    });
  } catch {
    return false;
  }

  const accountFields = accountObject.object.json;
  if (!accountFields) return false;

  const ownIds = extractIdList(accountFields.own_datasets);
  if (ownIds.includes(datasetId)) return true;

  const readIds = extractIdList(accountFields.read_datasets);
  return readIds.includes(datasetId);
}
