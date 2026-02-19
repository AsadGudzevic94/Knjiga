import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const name = params.get("name");
    const zip = params.get("zip") || null;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide a contractor/business name (at least 2 characters)." },
        { status: 400 }
      );
    }

    // Get contractor report summary
    const { data: report, error: reportError } = await supabase.rpc(
      "get_contractor_report",
      {
        p_name: name.trim(),
        p_zip_prefix: zip ? zip.slice(0, 3) : null,
      }
    );

    if (reportError) {
      console.error("Contractor report error:", reportError);
      return NextResponse.json(
        { error: "Failed to fetch contractor report." },
        { status: 500 }
      );
    }

    if (!report || report.length === 0) {
      return NextResponse.json({ found: false, name: name.trim() });
    }

    const r = report[0];

    // Get recent analyses for this contractor
    const { data: analyses, error: analysesError } = await supabase.rpc(
      "get_contractor_analyses",
      {
        p_name: name.trim(),
        p_zip_prefix: zip ? zip.slice(0, 3) : null,
      }
    );

    if (analysesError) {
      console.error("Contractor analyses error:", analysesError);
    }

    return NextResponse.json({
      found: true,
      name: name.trim(),
      report: {
        totalAnalyses: Number(r.total_analyses),
        avgScore: Number(Number(r.avg_score).toFixed(1)),
        avgQuoted: Math.round(Number(r.avg_quoted)),
        avgSavings: Math.round(Number(r.avg_savings)),
        overpricedPct: Math.round(Number(r.overpriced_pct)),
        categories: r.categories || [],
      },
      recentAnalyses: (analyses || []).map(
        (a: {
          id: number;
          created_at: string;
          service_category: string;
          overall_score: number;
          total_quoted: number;
          fair_total_low: number;
          fair_total_high: number;
          potential_savings: number;
          overall_verdict: string;
        }) => ({
          id: a.id,
          date: a.created_at,
          category: a.service_category,
          score: a.overall_score,
          totalQuoted: a.total_quoted,
          fairRange: `$${a.fair_total_low} - $${a.fair_total_high}`,
          savings: a.potential_savings,
          verdict: a.overall_verdict,
        })
      ),
    });
  } catch (error) {
    console.error("Contractor report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
