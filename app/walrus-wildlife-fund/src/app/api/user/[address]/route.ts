import { NextResponse } from "next/server";
import { getUserDatasets } from "../_lib";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    if (!address) {
      return NextResponse.json({ error: "No address" }, { status: 400 });
    }

    const datasets = await getUserDatasets(address);
    return NextResponse.json({ address, ...datasets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load user datasets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
