import { NextResponse } from "next/server";
import { stats } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ stats });
}
