import { EnokiClient } from "@mysten/enoki";
import { NextResponse } from "next/server";

const enokiClient = new EnokiClient({
  apiKey: process.env.ENOKI_SECRET_KEY!,
});

/**
 * POST /api/sponsor
 * Accepts a transaction-kind payload and returns Enoki-sponsored bytes + digest.
 *
 * Body: { transactionKindBytes: string (base64), sender: string,
 *         allowedMoveCallTargets?: string[], allowedAddresses?: string[] }
 */
export async function POST(req: Request) {
  try {
    const {
      transactionKindBytes,
      sender,
      allowedMoveCallTargets,
      allowedAddresses,
    } = await req.json();

    if (!transactionKindBytes || !sender) {
      return NextResponse.json(
        { error: "transactionKindBytes and sender are required" },
        { status: 400 },
      );
    }

    const sponsored = await enokiClient.createSponsoredTransaction({
      network: "testnet",
      transactionKindBytes,
      sender,
      allowedMoveCallTargets,
      allowedAddresses,
    });

    return NextResponse.json({
      bytes: sponsored.bytes,
      digest: sponsored.digest,
    });
  } catch (err) {
    console.error("[/api/sponsor] Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to sponsor transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
