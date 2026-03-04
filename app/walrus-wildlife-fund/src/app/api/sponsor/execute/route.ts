import { EnokiClient } from "@mysten/enoki";
import { NextResponse } from "next/server";

const enokiClient = new EnokiClient({
  apiKey: process.env.ENOKI_SECRET_KEY!,
});

/**
 * POST /api/sponsor/execute
 * Accepts a digest + user signature and executes the sponsored transaction.
 *
 * Body: { digest: string, signature: string }
 */
export async function POST(req: Request) {
  try {
    const { digest, signature } = await req.json();

    if (!digest || !signature) {
      return NextResponse.json(
        { error: "digest and signature are required" },
        { status: 400 },
      );
    }

    const result = await enokiClient.executeSponsoredTransaction({
      digest,
      signature,
    });

    return NextResponse.json({ digest: result.digest });
  } catch (err) {
    console.error("[/api/sponsor/execute] Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to execute transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
