import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";

type AnySuiClient = any;

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

export const canRead = async (
  datasetId: string,
  account: string,
  suiClient: AnySuiClient,
): Promise<boolean> => {
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
  }
  catch (error) {
    return false;
  }
  const accountFields = accountObject.object.json;
  if (!accountFields) return false;

  const ownIds = extractIdList(accountFields.own_datasets);
  if (ownIds.includes(datasetId)) return true;

  const readIds = extractIdList(accountFields.read_datasets);
  return readIds.includes(datasetId);
};
