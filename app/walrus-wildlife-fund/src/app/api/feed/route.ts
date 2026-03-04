import { NextResponse } from "next/server";
import { datasets, categories } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ datasets, categories });
}
