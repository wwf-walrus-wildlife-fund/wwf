import { NextResponse } from "next/server";
import { datasets, categories } from "@/lib/mock-data";
import { suiClient } from "../client";
import { deriveObjectID } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";

const getFeed = async () => {
  const platformObject = await suiClient.getObject({
    objectId: process.env.PLATFORM_OBJECT_ID!,
    include: {
      json: true
    }
  });

  const totalObjectsCount = (platformObject.object.json as any).counter;
  const count = Math.min(10, totalObjectsCount);

  // Assuming the objects are indexed from 1 to totalObjectsCount
  // and IDs/names are just for demonstration.
  // Replace getObjectAtIndex(i) as needed to fetch the real items.

  // E.g. create array with indexes of last 'count' objects from totalObjectsCount
  const lastObjects = Array.from(
    { length: count },
    (_, idx) => {
      return deriveObjectID(
        process.env.PACKAGE_ID!, 
        `u64`, 
        bcs.string().serialize((totalObjectsCount - count + idx + 1).toString()).toBytes()
      );
    }
  );

  const res = await suiClient.getObjects({
    objectIds: lastObjects,
    include: {
      json: true,
      owner: true
    }
  }) as any;

  return res.objects.map((object: any) => object.json);
}

export async function GET() {
  const feed = await getFeed();
  return NextResponse.json({ feed });
}
