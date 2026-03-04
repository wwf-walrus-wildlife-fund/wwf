import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";
import { suiClient } from "../client";

function extractFields(obj: any): any | null {
  return obj?.data?.content?.fields ?? obj?.object?.json ?? null;
}

function refToId(value: any): string | null {
  if (typeof value === "string") return value;
  if (typeof value?.id === "string") return value.id;
  if (typeof value?.objectId === "string") return value.objectId;
  return null;
}

function extractIdList(value: any): string[] {
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

async function getObjectAny(id: string): Promise<any> {
  try {
    return await (suiClient as any).getObject({
      id,
      options: { showContent: true, showOwner: true, showType: true },
    });
  } catch {
    return (suiClient as any).getObject({
      objectId: id,
      include: { json: true, owner: true },
    });
  }
}

async function getAccountObject(userAddress: string) {
  const packageId = process.env.PACKAGE_ID ?? process.env.NEXT_PUBLIC_PACKAGE_ID;
  const platformObjectId =
    process.env.PLATFORM_OBJECT_ID ?? process.env.NEXT_PUBLIC_PLATFORM_OBJECT_ID;
  if (!packageId || !platformObjectId) {
    throw new Error("Missing PACKAGE_ID or PLATFORM_OBJECT_ID");
  }

  const accountObjectId = deriveObjectID(
    platformObjectId,
    `${packageId}::account::AccountTag`,
    bcs.Address.serialize(userAddress).toBytes(),
  );

  try {
    return await getObjectAny(accountObjectId);
  } catch {
    return null;
  }
}

export async function getUserDatasets(
  userAddress: string,
): Promise<{ own_datasets: any[]; read_datasets: any[] }> {
  const accountObject = await getAccountObject(userAddress);
  const accountFields = extractFields(accountObject);
  if (!accountFields) {
    return { own_datasets: [], read_datasets: [] };
  }

  const ownIds = extractIdList(accountFields.own_datasets);
  const readIds = extractIdList(accountFields.read_datasets);
  const allIds = [...new Set([...ownIds, ...readIds])];

  if (allIds.length === 0) {
    return { own_datasets: [], read_datasets: [] };
  }

  const byId = new Map<string, any>();
  const objects = await Promise.all(
    allIds.map(async (id) => {
      try {
        return await getObjectAny(id);
      } catch {
        return null;
      }
    }),
  );

  for (let idx = 0; idx < allIds.length; idx += 1) {
    const objectId = allIds[idx];
    const fields = extractFields(objects[idx]);
    if (fields) {
      byId.set(objectId, { id: objectId, ...fields });
    }
  }

  return {
    own_datasets: ownIds.map((id) => byId.get(id)).filter(Boolean),
    read_datasets: readIds.map((id) => byId.get(id)).filter(Boolean),
  };
}
