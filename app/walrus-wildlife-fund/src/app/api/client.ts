import { SuiGrpcClient } from "@mysten/sui/grpc";

export const suiClient = new SuiGrpcClient({
    baseUrl: "https://fullnode.testnet.sui.io:443",
    network: "testnet",
});
