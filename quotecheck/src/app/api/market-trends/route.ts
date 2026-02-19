import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const category = params.get("category") || null;
    const zip = params.get("zip") || null;

    const { data, error } = await supabase.rpc("get_market_trends", {
      p_category: category,
      p_zip_prefix: zip,
    });

    if (error) {
      console.error("Market trends error:", error);
      return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
    }

    // Group by category and compute month-over-month change
    const byCategory: Record<string, Array<{
      month: string;
      avgQuoted: number;
      avgFairMid: number;
      analysisCount: number;
      avgScore: number;
    }>> = {};

    for (const row of data || []) {
      if (!byCategory[row.category]) byCategory[row.category] = [];
      byCategory[row.category].push({
        month: row.month,
        avgQuoted: Number(row.avg_quoted),
        avgFairMid: Number(row.avg_fair_mid),
        analysisCount: Number(row.analysis_count),
        avgScore: Number(row.avg_score),
      });
    }

    // Build summary with % change
    const summary = Object.entries(byCategory).map(([cat, months]) => {
      const sorted = months.sort((a, b) => a.month.localeCompare(b.month));
      const latest = sorted[sorted.length - 1];
      const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
      const pctChange = previous && previous.avgQuoted > 0
        ? Math.round(((latest.avgQuoted - previous.avgQuoted) / previous.avgQuoted) * 100)
        : 0;

      return {
        category: cat,
        currentAvg: latest.avgQuoted,
        currentFairMid: latest.avgFairMid,
        pctChange,
        totalAnalyses: months.reduce((sum, m) => sum + m.analysisCount, 0),
        avgScore: latest.avgScore,
        months: sorted,
      };
    });

    return NextResponse.json({
      trends: summary.sort((a, b) => b.totalAnalyses - a.totalAnalyses),
    });
  } catch (error) {
    console.error("Market trends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
