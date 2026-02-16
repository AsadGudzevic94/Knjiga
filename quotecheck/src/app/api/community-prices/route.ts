import { NextRequest, NextResponse } from "next/server";
import { getCommunityPrices, getCategoryStats } from "@/lib/supabase-db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const view = params.get("view");

  if (view === "stats") {
    const stats = await getCategoryStats();
    return NextResponse.json(stats);
  }

  const prices = await getCommunityPrices(
    params.get("category") || undefined,
    params.get("q") || undefined
  );

  return NextResponse.json(prices);
}
