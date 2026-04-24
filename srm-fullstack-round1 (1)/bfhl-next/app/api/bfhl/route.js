import { NextResponse } from "next/server";
import { processData } from "@/lib/processor";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body?.data)) {
      return NextResponse.json(
        { error: "`data` must be an array of strings." },
        { status: 400 }
      );
    }

    const result = processData(body.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }
}

// Respond to OPTIONS for CORS pre-flight (Vercel handles this, but just in case)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
