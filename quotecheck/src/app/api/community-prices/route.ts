import { NextRequest, NextResponse } from "next/server";
import { getCommunityPrices, getCategoryStats } from "@/lib/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const view = params.get("view");

  if (view === "stats") {
    const stats = getCategoryStats();
    return NextResponse.json(stats);
  }

  const prices = getCommunityPrices(
    params.get("category") || undefined,
    params.get("q") || undefined
  );

  return NextResponse.json(prices);
}
