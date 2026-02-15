import { NextRequest, NextResponse } from "next/server";
import { lookupReputation } from "@/lib/reputation-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, location, category } = body;

    if (!businessName || businessName.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide a business name." },
        { status: 400 }
      );
    }

    const result = await lookupReputation(
      businessName.trim(),
      location?.trim() || "",
      category || "other"
    );

    if (!result) {
      return NextResponse.json(
        { error: "Reputation lookup requires an API key. Set ANTHROPIC_API_KEY in your environment." },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to look up business reputation. Please try again." },
      { status: 500 }
    );
  }
}
