import { NextResponse } from "next/server";
import { datasets } from "@/lib/mock-data";

export async function GET() {
  const publishedDatasets = datasets.slice(0, 4);
  const purchasedDatasets = datasets.slice(4, 7);

  const stats = [
    { key: "published", label: "Published", value: "4" },
    { key: "purchased", label: "Purchased", value: "3" },
    { key: "earnings", label: "Total Earnings", value: "847 SUI" },
    { key: "storage", label: "Active Storage", value: "72.3 GB" },
  ];

  return NextResponse.json({ publishedDatasets, purchasedDatasets, stats });
}
