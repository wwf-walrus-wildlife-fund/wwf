import { NextResponse } from "next/server";
import { getUserDatasets } from "../_lib";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "No userId" }, { status: 400 });
    }

    const datasets = await getUserDatasets(userId);
    return NextResponse.json(datasets);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load datasets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
