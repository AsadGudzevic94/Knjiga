import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest } from "@/lib/types";
import { runFullAnalysisPipeline } from "@/lib/analysis-pipeline";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.quoteText || body.quoteText.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed quote (at least 10 characters)." },
        { status: 400 }
      );
    }

    if (!body.zipCode || !/^\d{5}$/.test(body.zipCode)) {
      return NextResponse.json(
        { error: "Please provide a valid 5-digit zip code." },
        { status: 400 }
      );
    }

    // Check user authentication and quota
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to analyze quotes." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user's token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication. Please log in again." },
        { status: 401 }
      );
    }

    // Check user's quota
    const { data: quotaData, error: quotaError } = await supabase.rpc(
      "check_user_quota",
      { p_user_id: user.id }
    );

    if (quotaError) {
      console.error("Quota check error:", quotaError);
      return NextResponse.json(
        { error: "Failed to verify subscription status." },
        { status: 500 }
      );
    }

    const quota = quotaData?.[0];
    if (!quota || !quota.is_subscribed) {
      return NextResponse.json(
        {
          error: "Active subscription required",
          message:
            "You need an active Pro subscription to analyze quotes. Visit the pricing page to subscribe.",
          redirectTo: "/pricing",
        },
        { status: 403 }
      );
    }

    if (!quota.has_quota) {
      return NextResponse.json(
        {
          error: "Monthly quota exceeded",
          message: `You've used all ${quota.quotes_limit} quote analyses this month. Your quota resets on the 1st of next month.`,
          quotasUsed: quota.quotes_used,
          quotasLimit: quota.quotes_limit,
        },
        { status: 429 }
      );
    }

    // Run the full analysis pipeline
    const result = await runFullAnalysisPipeline({
      quoteText: body.quoteText,
      serviceCategory: body.serviceCategory,
      zipCode: body.zipCode,
      userId: user.id,
      businessName: body.businessName,
    });

    return NextResponse.json({
      ...result.analysis,
      _cache: {
        hit: result.cached,
        ...(result.cacheType && { type: result.cacheType }),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze quote. Please try again." },
      { status: 500 }
    );
  }
}
