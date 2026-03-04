import { NextResponse } from "next/server";
import { categories as fallbackCategories } from "@/lib/mock-data";
import type { Dataset } from "@/lib/types";
import { extractFields, toUiDataset, getObjectBySdk } from "@/lib/sui-helpers";
import { suiClient } from "../client";
import { deriveObjectID } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";

const getFeed = async (): Promise<{ datasets: Dataset[]; categories: string[] }> => {
  const platformObjectId = process.env.PLATFORM_OBJECT_ID;
  if (!platformObjectId) {
    return { datasets: [], categories: fallbackCategories };
  }

  const platformObject = await getObjectBySdk(suiClient, platformObjectId);
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
        return await getObjectBySdk(suiClient, id);
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
