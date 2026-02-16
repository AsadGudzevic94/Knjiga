import { NextRequest, NextResponse } from "next/server";
import type { QuoteAnalysis, AnalyzeRequest, LineItemAnalysis } from "@/lib/types";
import { getRegionalFactor, matchService } from "@/lib/pricing-data";
import { getAIAnalysis, mergeAIAnalysis } from "@/lib/ai-analysis";
import { findCachedAnalysis, storeAnalysis } from "@/lib/supabase-db";
import { runScamDetection } from "@/lib/protection-engine";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function parseQuoteItems(text: string): { item: string; price: number }[] {
  const items: { item: string; price: number }[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    if (
      lowerLine.startsWith("total") ||
      lowerLine.startsWith("subtotal") ||
      lowerLine.startsWith("sub total") ||
      lowerLine.startsWith("tax") ||
      lowerLine.startsWith("grand total") ||
      lowerLine === ""
    ) {
      continue;
    }

    const priceMatch = line.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(",", ""));
      const item = line
        .replace(/\$\s*[\d,]+(?:\.\d{1,2})?/, "")
        .replace(/[-–—:.\s]+$/, "")
        .replace(/^[-–—:.\s]+/, "")
        .trim();
      if (item && price > 0) {
        items.push({ item, price });
      }
    }
  }

  if (items.length === 0) {
    const allPrices = [...text.matchAll(/\$\s*([\d,]+(?:\.\d{1,2})?)/g)];
    if (allPrices.length > 0) {
      const lastPrice = allPrices[allPrices.length - 1];
      items.push({
        item: "Total Service Quote",
        price: parseFloat(lastPrice[1].replace(",", "")),
      });
    }
  }

  return items;
}

function analyzeQuote(req: AnalyzeRequest): QuoteAnalysis {
  const items = parseQuoteItems(req.quoteText);
  const region = getRegionalFactor(req.zipCode);
  const regionFactor = region.factor;

  const lineItems: LineItemAnalysis[] = items.map((item) => {
    const matched = matchService(item.item, req.serviceCategory);

    let fairLow: number;
    let fairHigh: number;
    let fairMid: number;

    if (matched) {
      fairLow = Math.round(matched.lowPrice * regionFactor);
      fairHigh = Math.round(matched.highPrice * regionFactor);
      fairMid = Math.round(matched.avgPrice * regionFactor);
    } else {
      const baseFactor = 0.78;
      fairMid = Math.round(item.price * baseFactor * regionFactor);
      fairLow = Math.round(fairMid * 0.82);
      fairHigh = Math.round(fairMid * 1.18);
    }

    const hoursMatch = item.item.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (hoursMatch && matched && matched.unit === "per hour") {
      const hours = parseFloat(hoursMatch[1]);
      fairLow = Math.round(fairLow * hours);
      fairHigh = Math.round(fairHigh * hours);
      fairMid = Math.round(fairMid * hours);
    }

    const percentOver = fairMid > 0 ? Math.round(((item.price - fairMid) / fairMid) * 100) : 0;

    let status: "fair" | "slightly_high" | "overpriced";
    if (item.price <= fairHigh * 1.05) {
      status = "fair";
    } else if (item.price <= fairHigh * 1.3) {
      status = "slightly_high";
    } else {
      status = "overpriced";
    }

    const matchedName = matched ? matched.item : null;

    const notes =
      status === "fair"
        ? `${matchedName ? `Matched: ${matchedName}.` : ""} This is within the typical range for ${region.label}.`
        : status === "slightly_high"
        ? `${matchedName ? `Matched: ${matchedName}.` : ""} About ${Math.max(0, percentOver)}% above average for ${region.label}. You may be able to negotiate this down.`
        : `${matchedName ? `Matched: ${matchedName}.` : ""} This is ${Math.max(0, percentOver)}% above average for ${region.label}. Significantly overpriced — get a second quote or negotiate hard.`;

    return {
      item: item.item,
      quotedPrice: item.price,
      fairPriceLow: fairLow,
      fairPriceHigh: fairHigh,
      status,
      percentageOver: Math.max(0, percentOver),
      notes,
    };
  });

  const totalQuoted = lineItems.reduce((s, i) => s + i.quotedPrice, 0);
  const fairTotalLow = lineItems.reduce((s, i) => s + i.fairPriceLow, 0);
  const fairTotalHigh = lineItems.reduce((s, i) => s + i.fairPriceHigh, 0);
  const fairMidTotal = (fairTotalLow + fairTotalHigh) / 2;
  const potentialSavings = Math.max(0, Math.round(totalQuoted - fairMidTotal));

  const overallRatio = fairMidTotal > 0 ? totalQuoted / fairMidTotal : 1;
  let overallScore: number;
  let overallVerdict: QuoteAnalysis["overallVerdict"];

  if (overallRatio <= 0.9) {
    overallScore = 10;
    overallVerdict = "great_deal";
  } else if (overallRatio <= 1.0) {
    overallScore = 9;
    overallVerdict = "great_deal";
  } else if (overallRatio <= 1.08) {
    overallScore = 8;
    overallVerdict = "fair";
  } else if (overallRatio <= 1.15) {
    overallScore = 7;
    overallVerdict = "fair";
  } else if (overallRatio <= 1.25) {
    overallScore = 5;
    overallVerdict = "slightly_high";
  } else if (overallRatio <= 1.4) {
    overallScore = 4;
    overallVerdict = "slightly_high";
  } else if (overallRatio <= 1.6) {
    overallScore = 3;
    overallVerdict = "overpriced";
  } else if (overallRatio <= 2.0) {
    overallScore = 2;
    overallVerdict = "overpriced";
  } else {
    overallScore = 1;
    overallVerdict = "ripoff";
  }

  const redFlags: string[] = [];
  const overpricedItems = lineItems.filter((i) => i.status === "overpriced");
  const slightlyHighItems = lineItems.filter((i) => i.status === "slightly_high");

  if (overpricedItems.length > 0) {
    redFlags.push(
      `${overpricedItems.length} line item(s) are significantly above market rate for ${region.label}.`
    );
  }
  if (overpricedItems.length + slightlyHighItems.length === lineItems.length && lineItems.length > 1) {
    redFlags.push("Every single line item is above average — this vendor may be systematically overcharging.");
  }
  if (totalQuoted > fairTotalHigh * 1.3) {
    redFlags.push(
      `Total quote is 30%+ above the typical range. You could save ~$${potentialSavings.toLocaleString()}.`
    );
  }
  if (lineItems.length === 1 && totalQuoted > 500) {
    redFlags.push("Quote lacks itemization. Always ask for a breakdown of parts, labor, and fees.");
  }
  if (
    req.quoteText.toLowerCase().includes("emergency") ||
    req.quoteText.toLowerCase().includes("urgent") ||
    req.quoteText.toLowerCase().includes("after hours")
  ) {
    redFlags.push("Emergency/after-hours pricing detected. If this isn't truly urgent, request standard rates.");
  }

  const negotiationTips: string[] = [];
  negotiationTips.push("Always ask for a detailed written estimate with itemized parts and labor.");
  negotiationTips.push(`Get 2-3 competing quotes from other providers in ${region.label}.`);

  if (overpricedItems.length > 0) {
    negotiationTips.push(
      `Focus your negotiation on: ${overpricedItems.map((i) => i.item).join(", ")}. These have the most room to move.`
    );
  }
  if (potentialSavings > 200) {
    negotiationTips.push(
      `Potential savings: $${potentialSavings.toLocaleString()}. Mention you've researched fair market rates.`
    );
  }
  negotiationTips.push("Ask about discounts for paying upfront, in cash, or bundling services.");

  const categoryName =
    req.serviceCategory.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const negotiationScript = generateScript(
    categoryName,
    region.label,
    totalQuoted,
    Math.round(fairMidTotal),
    overpricedItems
  );

  const verdictText: Record<string, string> = {
    great_deal: `Great deal for ${region.label}! The price is at or below market average.`,
    fair: `This quote is within a fair range for ${region.label}. Minor room for negotiation.`,
    slightly_high: `This quote is above average for ${region.label}. There's meaningful room to negotiate.`,
    overpriced: `This quote is significantly overpriced for ${region.label}. We strongly recommend negotiating or getting competing quotes.`,
    ripoff: `This quote is extremely overpriced for ${region.label}. Do not accept this price — get competing quotes immediately.`,
  };

  return {
    overallScore,
    overallVerdict,
    totalQuoted: Math.round(totalQuoted),
    fairTotalLow,
    fairTotalHigh,
    potentialSavings,
    serviceCategory: categoryName,
    lineItems,
    redFlags,
    negotiationTips,
    negotiationScript,
    summary: verdictText[overallVerdict],
  };
}

function generateScript(
  category: string,
  regionLabel: string,
  quoted: number,
  fairMid: number,
  overpricedItems: LineItemAnalysis[]
): string {
  const target = fairMid;
  const itemsList =
    overpricedItems.length > 0
      ? `\n\nSpecifically, I'd like to discuss:\n${overpricedItems
          .map(
            (i) =>
              `- ${i.item}: You quoted $${i.quotedPrice.toLocaleString()}, but the typical rate in ${regionLabel} is $${i.fairPriceLow.toLocaleString()}-$${i.fairPriceHigh.toLocaleString()}.`
          )
          .join("\n")}`
      : "";

  return `"Hi, thank you for the ${category.toLowerCase()} estimate. I appreciate you putting this together.

I've done some research on typical pricing in the ${regionLabel} area, and the fair market range for this work is around $${target.toLocaleString()}. Your quote of $${Math.round(quoted).toLocaleString()} is above that range.${itemsList}

I'd really like to work with you on this project. Is there any flexibility on the pricing? I'm happy to move forward today if we can get closer to the market rate.

If it helps, I have a couple of other quotes I'm comparing, but I'd prefer to go with you if we can find a fair number for both of us."`;
}

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to analyze quotes." },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication. Please log in again." },
        { status: 401 }
      );
    }

    // Check user's quota
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('check_user_quota', { p_user_id: user.id });

    if (quotaError) {
      console.error('Quota check error:', quotaError);
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
          message: "You need an active Pro subscription to analyze quotes. Visit the pricing page to subscribe.",
          redirectTo: "/pricing"
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
          quotasLimit: quota.quotes_limit
        },
        { status: 429 }
      );
    }

    const region = getRegionalFactor(body.zipCode);

    // Step 0: Check the cache for a similar previous analysis
    const cached = await findCachedAnalysis(
      body.quoteText,
      body.serviceCategory,
      body.zipCode
    );

    if (cached && cached.matchType === "exact") {
      console.log(`[QuoteCheck] Cache HIT (exact, ${cached.ageHours}h old)`);
      return NextResponse.json({
        ...cached.result,
        _cache: { hit: true, type: "exact", ageHours: cached.ageHours },
      });
    }

    // Step 1: Run rule-based analysis (instant)
    const ruleBasedAnalysis = analyzeQuote(body);

    // Step 1.5: If we have a strong similar match, return it with fresh rule-based data
    if (cached && cached.matchType === "similar" && cached.similarity >= 0.7) {
      console.log(
        `[QuoteCheck] Cache HIT (similar ${Math.round(cached.similarity * 100)}%, ${cached.ageHours}h old)`
      );
      // Use the AI analysis from the cache but combine with fresh rule-based numbers
      const merged = cached.result.aiAnalysis
        ? {
            ...ruleBasedAnalysis,
            aiAnalysis: cached.result.aiAnalysis,
            lineItems: ruleBasedAnalysis.lineItems.map((li) => {
              const cachedItem = cached.result.lineItems.find(
                (cli) =>
                  cli.item.toLowerCase().includes(li.item.toLowerCase().split(" ")[0]) ||
                  li.item.toLowerCase().includes(cli.item.toLowerCase().split(" ")[0])
              );
              return {
                ...li,
                aiExplanation: cachedItem?.aiExplanation || undefined,
              };
            }),
          }
        : ruleBasedAnalysis;

      return NextResponse.json({
        ...merged,
        _cache: {
          hit: true,
          type: "similar",
          similarity: cached.similarity,
          ageHours: cached.ageHours,
        },
      });
    }

    // Step 2: Enhance with Claude AI analysis (if API key available)
    const aiResult = await getAIAnalysis(
      body.quoteText,
      body.serviceCategory,
      body.zipCode,
      ruleBasedAnalysis
    );

    // Step 3: Merge AI insights into the result, or return rule-based only
    const mergedAnalysis = aiResult
      ? mergeAIAnalysis(ruleBasedAnalysis, aiResult)
      : ruleBasedAnalysis;

    // Step 3.5: Run scam detection, hidden fee prediction, seasonal intelligence
    const fairMid = (mergedAnalysis.fairTotalLow + mergedAnalysis.fairTotalHigh) / 2;
    const protection = runScamDetection(
      body.quoteText,
      body.serviceCategory,
      mergedAnalysis.totalQuoted,
      fairMid
    );

    const finalAnalysis: QuoteAnalysis = {
      ...mergedAnalysis,
      protection: {
        scamFlags: protection.flaggedPatterns.map((f) => ({
          name: f.pattern.name,
          description: f.pattern.description,
          severity: f.pattern.severity,
          matchedOn: f.matchedOn,
          whatToDo: f.pattern.whatToDo,
          realExample: f.pattern.realExample,
        })),
        hiddenFees: protection.hiddenFees,
        seasonalTip: protection.seasonalTip,
        smartQuestions: protection.smartQuestions,
        riskLevel: protection.riskLevel,
      },
    };

    // Step 4: Store in database for future cache hits and community data
    try {
      const id = await storeAnalysis(
        body.quoteText,
        body.serviceCategory,
        body.zipCode,
        region.label,
        finalAnalysis,
        user.id
      );
      console.log(`[QuoteCheck] Stored analysis #${id}`);
    } catch (storeErr) {
      console.error("[QuoteCheck] Failed to store analysis:", storeErr);
    }

    // Step 5: Increment user's usage counter (after successful analysis)
    try {
      await supabase.rpc('increment_user_usage', {
        p_user_id: user.id,
        p_api_cost: 0.03 // Average cost per Claude API call
      });
      console.log(`[QuoteCheck] Incremented usage for user ${user.id}`);
    } catch (usageErr) {
      console.error("[QuoteCheck] Failed to increment usage:", usageErr);
      // Don't fail the request if usage tracking fails
    }

    return NextResponse.json({
      ...finalAnalysis,
      _cache: { hit: false },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze quote. Please try again." },
      { status: 500 }
    );
  }
}
