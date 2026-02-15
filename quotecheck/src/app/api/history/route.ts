import { NextRequest, NextResponse } from "next/server";
import { queryHistory, getStoredAnalysis } from "@/lib/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const id = params.get("id");
  if (id) {
    const result = getStoredAnalysis(Number(id));
    if (!result) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  const results = queryHistory({
    category: params.get("category") || undefined,
    zipCode: params.get("zip") || undefined,
    search: params.get("q") || undefined,
    limit: Number(params.get("limit")) || 20,
    offset: Number(params.get("offset")) || 0,
    sortBy: (params.get("sort") as "recent" | "score_high" | "score_low" | "price_high" | "price_low") || "recent",
  });

  return NextResponse.json(results);
}
