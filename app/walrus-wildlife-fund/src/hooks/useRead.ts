import { suiClient } from "@/app/api/client";
import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";


export const canRead = async (datasetId: string, account: string) => {
    try {
        const accountObject = await suiClient.getObject({
            objectId: deriveObjectID(process.env.PACKAGE_ID!, `${process.env.PACKAGE_ID}::dataset::Reader`, bcs.string().serialize(account).toBytes()),
            include: {
                json: true
            }
        })
        return true;
    } catch (error) {
        return false;
    }
}
