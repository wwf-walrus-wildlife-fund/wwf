import { NextResponse } from "next/server";
import { categories as fallbackCategories } from "@/lib/mock-data";
import type { Dataset } from "@/lib/types";
import { suiClient } from "../client";
import { deriveObjectID } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";

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

function extractFields(obj: any): any | null {
  return obj?.data?.content?.fields ?? obj?.object?.json ?? null;
}

function toUiDataset(objectId: string, fields: any): Dataset {
  const priceMist = Number(fields?.price_sui ?? 0);
  const priceSui = Number.isFinite(priceMist)
    ? (priceMist / 1_000_000_000).toString()
    : "0";

  const blobIds = Array.isArray(fields?.blob_ids?.contents)
    ? fields.blob_ids.contents
    : [];

  return {
    id: objectId,
    name: String(fields?.name ?? "Untitled Dataset"),
    description: String(fields?.description ?? ""),
    category: String(fields?.project ?? "Other"),
    price: priceSui,
    size: "N/A",
    format: "Encrypted",
    downloads: 0,
    expiresIn: "N/A",
    seller: String(fields?.funds_receiver ?? ""),
    verified: false,
  };
}

const getFeed = async (): Promise<{ datasets: Dataset[]; categories: string[] }> => {
  const platformObjectId = process.env.PLATFORM_OBJECT_ID;
  if (!platformObjectId) {
    return { datasets: [], categories: fallbackCategories };
  }

  const platformObject = await getObjectAny(platformObjectId);
  const platformFields = extractFields(platformObject);
  const totalObjectsCount = Number(platformFields?.dataset_counter ?? 0);

  if (!Number.isFinite(totalObjectsCount) || totalObjectsCount <= 0) {
    return { datasets: [], categories: fallbackCategories };
  }

  const count = Math.min(10, totalObjectsCount);
  const lastObjects = Array.from({ length: count }, (_, idx) =>
    deriveObjectID(
      platformObjectId,
      "u64",
      bcs.u64().serialize(totalObjectsCount - count + idx).toBytes(),
    ),
  );

  const objects = await Promise.all(
    lastObjects.map(async (id) => {
      try {
        return await getObjectAny(id);
      } catch {
        return null;
      }
    }),
  );

  const datasets = objects
    .map((obj, idx) => {
      const fields = extractFields(obj);
      if (!fields) return null;
      return toUiDataset(lastObjects[idx], fields);
    })
    .filter((d): d is Dataset => d !== null);

  const categories = [
    "All",
    ...new Set(datasets.map((d) => d.category).filter(Boolean)),
  ];

  return {
    datasets,
    categories: categories.length > 1 ? categories : fallbackCategories,
  };
};

export async function GET() {
  try {
    const { datasets, categories } = await getFeed();
    return NextResponse.json({ datasets, categories, feed: datasets });
  } catch (error) {
    console.error("[/api/feed] failed:", error);
    return NextResponse.json(
      { datasets: [], categories: fallbackCategories, feed: [] },
      { status: 200 },
    );
  }
}
