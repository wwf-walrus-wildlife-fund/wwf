import { createDAppKit } from "@mysten/dapp-kit-react";
import { enokiWalletsInitializer } from "@mysten/enoki";
import { SuiGrpcClient } from "@mysten/sui/grpc";

const GRPC_URLS = {
  mainnet: "https://fullnode.mainnet.sui.io:443",
  testnet: "https://fullnode.testnet.sui.io:443",
  devnet: "https://fullnode.devnet.sui.io:443",
};

export const ACTIVE_NETWORK = "testnet" as const;

export const dAppKit = createDAppKit({
  enableBurnerWallet: process.env.NODE_ENV === "development",
  networks: ["mainnet", "testnet", "devnet"],
  defaultNetwork: ACTIVE_NETWORK,
  createClient(network) {
    return new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] });
  },
  walletInitializers: [
    enokiWalletsInitializer({
      apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
      providers: {
        google: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        },
      },
    }),
  ],
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
