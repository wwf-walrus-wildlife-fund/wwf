import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";
import { NextResponse } from "next/server";
import { suiClient } from "../../client";

type ObjectRef = { id?: string } | string;

function refToId(value: ObjectRef): string | null {
  if (typeof value === "string") return value;
  return typeof value?.id === "string" ? value.id : null;
}

const getAccountObject = async (userId: string) => {
  const packageId = process.env.PACKAGE_ID ?? process.env.NEXT_PUBLIC_PACKAGE_ID;
  if (!packageId) {
    throw new Error("Missing PACKAGE_ID");
  }

  const accountKey = bcs.string().serialize(userId + "account").toBytes();
  const accountObjectId = deriveObjectID(
    packageId,
    `${packageId}::account::AccountTag`,
    accountKey,
  );

  try {
    const accountObject = await (suiClient as any).getObject({
      objectId: accountObjectId,
      include: {
        json: true,
      },
    });
    return accountObject;
  } catch {
    return null;
  }
};

const getDatasets = async (
  userId: string,
): Promise<{ own_datasets: any[]; read_datasets: any[] }> => {
  const accountObject = await getAccountObject(userId);
  if (!accountObject?.object?.json) {
    return { own_datasets: [], read_datasets: [] };
  }

  const ownRefs = (accountObject.object.json as any).own_datasets as ObjectRef[] | undefined;
  const readRefs = (accountObject.object.json as any).read_datasets as ObjectRef[] | undefined;

  const ownIds = Array.isArray(ownRefs)
    ? ownRefs.map(refToId).filter((id): id is string => Boolean(id))
    : [];
  const readIds = Array.isArray(readRefs)
    ? readRefs.map(refToId).filter((id): id is string => Boolean(id))
    : [];

  const allIds = [...new Set([...ownIds, ...readIds])];
  if (allIds.length === 0) {
    return { own_datasets: [], read_datasets: [] };
  }

  let res: any;
  try {
    res = await (suiClient as any).getObjects({
      objectIds: allIds,
      include: {
        json: true,
      },
    });
  } catch {
    return { own_datasets: [], read_datasets: [] };
  }

  const byId = new Map<string, any>();
  const objects = Array.isArray(res?.objects) ? res.objects : [];
  for (const object of objects) {
    const objectId = object?.objectId ?? object?.id ?? object?.json?.id;
    if (typeof objectId === "string" && object?.json) {
      byId.set(objectId, object.json);
    }
  }

  return {
    own_datasets: ownIds.map((id) => byId.get(id)).filter(Boolean),
    read_datasets: readIds.map((id) => byId.get(id)).filter(Boolean),
  };
};

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "No userId" }, { status: 400 });
    }

    const datasets = await getDatasets(userId);
    return NextResponse.json(datasets);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load datasets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
