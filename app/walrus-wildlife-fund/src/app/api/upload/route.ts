import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;
    const price = formData.get("price") as string | null;
    const storageDays = formData.get("storageDays") as string | null;

    if (!file || !name || !description || !category || !price || !storageDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileSize = bytes.byteLength;

    // TODO: Encrypt the file with Seal and upload to Walrus
    // TODO: Register the dataset on the SUI smart contract

    return NextResponse.json({
      success: true,
      dataset: {
        name,
        description,
        category,
        price,
        storageDays: Number(storageDays),
        fileSize,
        fileName: file.name,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
