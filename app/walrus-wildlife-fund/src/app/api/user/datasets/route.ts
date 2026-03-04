"use server";

import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";
import { NextResponse } from "next/server";
import { suiClient } from "../../client";

const getAccountObject = async (userId: string) => {
    const accountKey = bcs.string().serialize(userId + "account").toBytes()
    const accountObjectId = deriveObjectID(process.env.PACKAGE_ID!, `${process.env.PACKAGE_ID}::account::AccountTag`, accountKey);

    try {
        const accountObject = await suiClient.getObject({
            objectId: accountObjectId,
            include: {
                json: true
            }
        });

        return accountObject;
    } catch (error) {
        return null;
    }

}

const getDatasets = async (userId: string): Promise<{ created: any[], purchased: any[] } | null> => {
    const accountObject = await getAccountObject(userId);
    const objects = [];
    if (!accountObject) {
        return { created: [], purchased: [] };
    }

    for (const dataset of (accountObject.object.json as any).created_datasets) {
        objects.push(dataset);
    }
    for (const dataset of (accountObject.object.json as any).purchased_datasets) {
        objects.push(dataset);
    }

    const res = await suiClient.getObjects({
        objectIds: objects.map((object) => object.id),
        include: {
            json: true,
        }
    }) as any;
    
    const created = res.objects.filter((object: any) => object.json.creator === userId).map((object: any) => object.json);
    const purchased = res.objects.filter((object: any) => object.json.creator != userId).map((object: any) => object.json);

    return { created, purchased };
}

export const GET = async (request: Request) => {

    const body = await request.formData();
    if (!body) {
        return NextResponse.json({ error: 'No body' }, { status: 400 });
    }

    const userId = body.get("userId") as string;
    if (!userId) {
        return NextResponse.json({ error: 'No userId' }, { status: 400 });
    }

    const datasets = await getDatasets(userId);

    if (!datasets) {
        return NextResponse.json({ error: 'No datasets' }, { status: 400 });
    }

    return NextResponse.json({ created: datasets.created, purchased: datasets.purchased });
}
