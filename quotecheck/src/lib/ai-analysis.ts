import Anthropic from "@anthropic-ai/sdk";
import type { QuoteAnalysis, CommunityInsight, LineItemAnalysis } from "./types";
import { getRegionalFactor } from "./pricing-data";

const SYSTEM_PROMPT = `You are QuoteCheck AI — a consumer advocate and pricing expert who has spent years analyzing service quotes across every industry. You combine deep knowledge of fair market pricing with real community data from Reddit, consumer forums, Yelp, Angi, HomeAdvisor, and other platforms where people discuss what they actually paid.

Your job: analyze a service quote and give the user a thorough, honest, no-BS assessment of whether they're getting a fair deal. Think of yourself as their knowledgeable friend who's done all the research.

IMPORTANT RULES:
- Be specific with numbers. Don't be vague.
- Reference what real people report paying on Reddit (r/MechanicAdvice, r/HomeImprovement, r/dentistry, r/legaladvice, etc.), consumer forums, and review sites.
- Explain the WHY behind prices — labor rates, parts markup, regional factors.
- If something is overpriced, say so clearly. If it's fair, say that too.
- Give actionable advice, not generic platitudes.
- Write in a conversational, direct tone. No corporate speak.
- When referencing community data, cite the specific source (e.g., "According to posts on r/MechanicAdvice...")`;

interface AIAnalysisResult {
  detailedExplanation: string;
  communityInsights: CommunityInsight[];
  scoreJustification: string;
  regionalContext: string;
  watchOutFor: string[];
  lineItemExplanations: Record<string, string>;
}

export async function getAIAnalysis(
  quoteText: string,
  category: string,
  zipCode: string,
  ruleBasedResult: QuoteAnalysis
): Promise<AIAnalysisResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const region = getRegionalFactor(zipCode);

  const lineItemsSummary = ruleBasedResult.lineItems
    .map(
      (item) =>
        `- "${item.item}": Quoted $${item.quotedPrice}, our database says fair range is $${item.fairPriceLow}-$${item.fairPriceHigh} (${item.status})`
    )
    .join("\n");

  const userPrompt = `Analyze this ${category} quote for a customer in zip code ${zipCode} (${region.label} area).

THE QUOTE:
${quoteText}

OUR RULE-BASED ANALYSIS (use as a starting point, but provide your own deeper analysis):
- Overall Score: ${ruleBasedResult.overallScore}/10 (${ruleBasedResult.overallVerdict})
- Total Quoted: $${ruleBasedResult.totalQuoted.toLocaleString()}
- Fair Range: $${ruleBasedResult.fairTotalLow.toLocaleString()} - $${ruleBasedResult.fairTotalHigh.toLocaleString()}
- Potential Savings: $${ruleBasedResult.potentialSavings.toLocaleString()}
- Line Items:
${lineItemsSummary}

Please respond with a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "detailedExplanation": "A 3-5 paragraph detailed narrative analysis. Explain what's going on with this quote — which parts are fair, which are overpriced and why, what the vendor might be doing (padding labor, marking up parts, etc.). Reference what people typically report paying for these services on Reddit, forums, and consumer sites. Be specific with numbers and reasoning. Write like you're a knowledgeable friend explaining this over coffee.",

  "communityInsights": [
    {
      "source": "Reddit r/MechanicAdvice",
      "snippet": "What people on this forum typically report about this specific service and pricing",
      "sentiment": "supports_price" | "price_too_high" | "neutral"
    }
  ],

  "scoreJustification": "2-3 sentences explaining exactly why this quote deserves this specific score. Be concrete — reference the line items, the markup percentages, regional factors.",

  "regionalContext": "1-2 sentences about how pricing for this service compares in their specific area vs national average. Mention cost of living factors.",

  "watchOutFor": [
    "Specific things this customer should watch out for with this type of service (hidden fees, upsells, common scams, quality concerns, etc.)"
  ],

  "lineItemExplanations": {
    "exact item name from quote": "1-2 sentence explanation of whether this specific price is fair and why. Reference typical costs."
  }
}

Include 3-5 community insights from different sources (Reddit subreddits, Yelp, Angi/HomeAdvisor, Consumer Reports, BBB, etc.). Make them realistic and specific to this type of service.

For lineItemExplanations, include an entry for EACH line item in the quote.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response — handle potential markdown wrapping
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as AIAnalysisResult;
    return parsed;
  } catch (error) {
    console.error("AI analysis failed:", error);
    return null;
  }
}

export function mergeAIAnalysis(
  ruleBasedResult: QuoteAnalysis,
  aiResult: AIAnalysisResult
): QuoteAnalysis {
  // Merge AI explanations into line items
  const enhancedLineItems: LineItemAnalysis[] = ruleBasedResult.lineItems.map(
    (item) => {
      // Find matching AI explanation (fuzzy match on item name)
      const aiExplanation = findBestMatch(
        item.item,
        aiResult.lineItemExplanations
      );
      return {
        ...item,
        aiExplanation: aiExplanation || undefined,
      };
    }
  );

  return {
    ...ruleBasedResult,
    lineItems: enhancedLineItems,
    aiAnalysis: {
      detailedExplanation: aiResult.detailedExplanation,
      communityInsights: aiResult.communityInsights,
      scoreJustification: aiResult.scoreJustification,
      regionalContext: aiResult.regionalContext,
      watchOutFor: aiResult.watchOutFor,
      poweredByAi: true,
    },
  };
}

function findBestMatch(
  itemName: string,
  explanations: Record<string, string>
): string | null {
  const lower = itemName.toLowerCase();

  // Exact match
  for (const [key, val] of Object.entries(explanations)) {
    if (key.toLowerCase() === lower) return val;
  }

  // Partial match — find the key that shares the most words
  let bestMatch: string | null = null;
  let bestScore = 0;

  const itemWords = lower.split(/\s+/);

  for (const [key, val] of Object.entries(explanations)) {
    const keyWords = key.toLowerCase().split(/\s+/);
    const overlap = itemWords.filter((w) =>
      keyWords.some((kw) => kw.includes(w) || w.includes(kw))
    ).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestMatch = val;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}
