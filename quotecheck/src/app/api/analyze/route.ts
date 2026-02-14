import { NextRequest, NextResponse } from "next/server";
import type { QuoteAnalysis, AnalyzeRequest } from "@/lib/types";

function parseQuoteItems(text: string): { item: string; price: number }[] {
  const items: { item: string; price: number }[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const priceMatch = line.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(",", ""));
      const item = line.replace(/\$\s*[\d,]+(?:\.\d{2})?/, "").trim();
      if (item && price > 0) {
        items.push({ item: item.replace(/[-:.]$/, "").trim(), price });
      }
    }
  }

  if (items.length === 0) {
    const totalMatch = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
    if (totalMatch) {
      items.push({
        item: "Total Service Quote",
        price: parseFloat(totalMatch[1].replace(",", "")),
      });
    }
  }

  return items;
}

function getCategoryMultiplier(category: string): number {
  const multipliers: Record<string, number> = {
    auto_repair: 0.85,
    plumbing: 0.80,
    electrical: 0.82,
    hvac: 0.78,
    dental: 0.75,
    medical: 0.70,
    legal: 0.88,
    home_renovation: 0.82,
    roofing: 0.80,
    wedding: 0.65,
    moving: 0.78,
    other: 0.80,
  };
  return multipliers[category] || 0.80;
}

function getZipCodeFactor(zip: string): number {
  const firstDigit = parseInt(zip.charAt(0));
  const factors: Record<number, number> = {
    0: 1.15, // Northeast
    1: 1.12,
    2: 1.08,
    3: 0.92, // Southeast
    4: 0.95,
    5: 0.90, // Midwest
    6: 0.93,
    7: 0.88, // South
    8: 1.05, // Mountain West
    9: 1.18, // West Coast
  };
  return factors[firstDigit] ?? 1.0;
}

function analyzeQuote(req: AnalyzeRequest): QuoteAnalysis {
  const items = parseQuoteItems(req.quoteText);
  const categoryMultiplier = getCategoryMultiplier(req.serviceCategory);
  const zipFactor = getZipCodeFactor(req.zipCode);
  const baseVariance = 0.15;

  const lineItems = items.map((item) => {
    const fairMid = item.price * categoryMultiplier * zipFactor;
    const fairLow = Math.round(fairMid * (1 - baseVariance));
    const fairHigh = Math.round(fairMid * (1 + baseVariance));
    const percentOver = Math.round(
      ((item.price - fairMid) / fairMid) * 100
    );

    let status: "fair" | "slightly_high" | "overpriced";
    if (item.price <= fairHigh * 1.05) {
      status = "fair";
    } else if (item.price <= fairHigh * 1.25) {
      status = "slightly_high";
    } else {
      status = "overpriced";
    }

    const notes =
      status === "fair"
        ? "This line item is within the typical price range for your area."
        : status === "slightly_high"
        ? `This is about ${percentOver}% above the average. You may be able to negotiate this down.`
        : `This is ${percentOver}% above average. This item is significantly overpriced and should be negotiated or you should get a second quote.`;

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

  const overallRatio = totalQuoted / fairMidTotal;
  let overallScore: number;
  let overallVerdict: QuoteAnalysis["overallVerdict"];

  if (overallRatio <= 0.95) {
    overallScore = 10;
    overallVerdict = "great_deal";
  } else if (overallRatio <= 1.05) {
    overallScore = 8;
    overallVerdict = "fair";
  } else if (overallRatio <= 1.15) {
    overallScore = 6;
    overallVerdict = "fair";
  } else if (overallRatio <= 1.3) {
    overallScore = 4;
    overallVerdict = "slightly_high";
  } else if (overallRatio <= 1.5) {
    overallScore = 3;
    overallVerdict = "overpriced";
  } else {
    overallScore = 1;
    overallVerdict = "ripoff";
  }

  const redFlags: string[] = [];
  const overpricedItems = lineItems.filter((i) => i.status === "overpriced");
  if (overpricedItems.length > 0) {
    redFlags.push(
      `${overpricedItems.length} line item(s) are significantly above market rate.`
    );
  }
  if (totalQuoted > fairTotalHigh * 1.3) {
    redFlags.push("The total quote is 30%+ above the typical range for your area.");
  }
  if (lineItems.length === 1 && totalQuoted > 500) {
    redFlags.push(
      "The quote lacks itemization. Ask for a detailed breakdown of parts and labor."
    );
  }
  if (
    req.quoteText.toLowerCase().includes("emergency") ||
    req.quoteText.toLowerCase().includes("urgent")
  ) {
    redFlags.push("Emergency/urgent pricing detected. If this isn't truly urgent, request standard rates.");
  }

  const negotiationTips: string[] = [
    `Ask for a line-by-line breakdown if you don't have one already.`,
    `Get at least 2-3 competing quotes to use as leverage.`,
    `Ask if there are any discounts for paying in cash or upfront.`,
  ];
  if (overpricedItems.length > 0) {
    negotiationTips.push(
      `Focus negotiation on: ${overpricedItems.map((i) => i.item).join(", ")} - these are the most overpriced items.`
    );
  }
  if (potentialSavings > 500) {
    negotiationTips.push(
      `You could save approximately $${potentialSavings.toLocaleString()} by negotiating to fair market rates.`
    );
  }

  const categoryName =
    req.serviceCategory.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Service";

  const negotiationScript = generateNegotiationScript(
    categoryName,
    totalQuoted,
    fairMidTotal,
    overpricedItems.map((i) => i.item)
  );

  const verdictText: Record<string, string> = {
    great_deal: "This quote is a great deal! The price is below market average.",
    fair: "This quote is within a fair range for your area.",
    slightly_high: "This quote is above average. There's room to negotiate.",
    overpriced: "This quote is significantly overpriced. We recommend negotiating or getting additional quotes.",
    ripoff: "This quote is extremely overpriced. We strongly recommend getting competing quotes before proceeding.",
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

function generateNegotiationScript(
  category: string,
  quoted: number,
  fairMid: number,
  overpricedItems: string[]
): string {
  const target = Math.round(fairMid);
  const itemsList = overpricedItems.length > 0
    ? `\n\nSpecifically, I'd like to discuss the pricing on: ${overpricedItems.join(", ")}. Based on my research, these items appear to be above the going rate in this area.`
    : "";

  return `"Hi, thank you for the ${category.toLowerCase()} quote. I appreciate your time putting this together.

I've done some research on typical pricing in our area, and the fair market range for this work appears to be around $${target.toLocaleString()}. Your quote of $${Math.round(quoted).toLocaleString()} is a bit above that range.${itemsList}

I'd really like to work with you on this. Is there any flexibility on the pricing? I'm ready to move forward today if we can get closer to the market rate.

If needed, I'm happy to get a couple more quotes, but I'd prefer to work with you if we can find a number that works for both of us."`;
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

    // Simulate brief processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const analysis = analyzeQuote(body);
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze quote. Please try again." },
      { status: 500 }
    );
  }
}
