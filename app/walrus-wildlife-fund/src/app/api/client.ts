import { SuiGrpcClient } from "@mysten/sui/grpc";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

export const suiClient = new SuiGrpcClient({
    baseUrl: getJsonRpcFullnodeUrl("testnet"),
    network: "testnet",
});
