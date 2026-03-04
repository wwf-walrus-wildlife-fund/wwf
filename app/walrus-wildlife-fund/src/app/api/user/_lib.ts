import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";
import { extractFields, extractIdList, getObjectAny } from "@/lib/sui-helpers";
import { suiClient } from "../client";

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
    return await getObjectAny(suiClient, accountObjectId);
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
        return await getObjectAny(suiClient, id);
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
