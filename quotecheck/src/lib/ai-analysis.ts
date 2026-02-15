import Anthropic from "@anthropic-ai/sdk";
import type { QuoteAnalysis, CommunityInsight, LineItemAnalysis } from "./types";
import { getRegionalFactor } from "./pricing-data";
import { webSearch, fetchPage } from "./search-tools";
import type { Tool, MessageParam, ContentBlock } from "@anthropic-ai/sdk/resources/messages";

// ── Tool definitions for the AI agent ───────────────────────

const AGENT_TOOLS: Tool[] = [
  {
    name: "search_web",
    description:
      "Search the web for real pricing data, Reddit discussions, forum posts, and consumer reports about service costs. Use specific queries like 'brake pad replacement cost 2024 reddit' or 'average plumber hourly rate Austin TX'. Call this multiple times with different queries to gather comprehensive data.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Search query — be specific. Include the service type, location if relevant, and target sources like 'reddit', 'forum', 'cost', 'price', 'average'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "read_page",
    description:
      "Fetch and read the content of a specific web page — useful for reading Reddit threads, forum discussions, or pricing guides found via search. Returns the text content of the page.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The full URL of the page to read.",
        },
      },
      required: ["url"],
    },
  },
];

// ── System prompt ───────────────────────────────────────────

const SYSTEM_PROMPT = `You are QuoteCheck AI — a consumer pricing research agent. Your job is to deeply research whether a service quote is fair by searching the internet for REAL pricing data.

You have two tools:
1. search_web — Search the internet for pricing data, Reddit discussions, forum posts, consumer reviews
2. read_page — Read the full content of a web page (Reddit thread, pricing guide, etc.)

YOUR RESEARCH PROCESS:
1. FIRST, search for the specific services in the quote + "cost" / "price" / "reddit" / "forum"
2. Read 2-3 of the most relevant results (especially Reddit threads where people discuss what they paid)
3. Search for regional pricing data for the customer's area
4. Search for any common scams or overcharging patterns for this service type
5. THEN synthesize everything into your analysis

BE THOROUGH. Do at least 3-5 searches and read at least 2-3 pages before giving your final answer. Real data > assumptions.

IMPORTANT:
- ALWAYS cite your actual sources with real URLs from your research
- Quote specific data points you found (e.g., "A user on r/MechanicAdvice reported paying $180 for front brake pads at an independent shop in Texas")
- If you can't find specific data for an item, say so honestly rather than making it up
- Be direct and conversational — write like a knowledgeable friend, not a corporate report
- Give specific numbers and ranges based on what you actually found online`;

// ── Agentic analysis ────────────────────────────────────────

interface AIAnalysisResult {
  detailedExplanation: string;
  communityInsights: CommunityInsight[];
  scoreJustification: string;
  regionalContext: string;
  watchOutFor: string[];
  lineItemExplanations: Record<string, string>;
}

const MAX_AGENT_TURNS = 12; // Max tool-use round trips

export async function getAIAnalysis(
  quoteText: string,
  category: string,
  zipCode: string,
  ruleBasedResult: QuoteAnalysis
): Promise<AIAnalysisResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const hasSearchKey = !!process.env.BRAVE_SEARCH_API_KEY;
  const region = getRegionalFactor(zipCode);

  const lineItemsSummary = ruleBasedResult.lineItems
    .map(
      (item) =>
        `- "${item.item}": Quoted $${item.quotedPrice}, estimated fair range $${item.fairPriceLow}-$${item.fairPriceHigh} (${item.status})`
    )
    .join("\n");

  const toolInstructions = hasSearchKey
    ? `You HAVE web search and page reading tools available. USE THEM to research real pricing data before giving your analysis. Do at least 3-5 searches.`
    : `Web search is not currently available. Provide the best analysis you can based on your training data. Be honest that this is based on general knowledge rather than live data.`;

  const userPrompt = `I need you to research and analyze this ${category} quote for a customer in zip code ${zipCode} (${region.label} area).

${toolInstructions}

THE QUOTE TO ANALYZE:
---
${quoteText}
---

OUR PRELIMINARY ANALYSIS:
- Score: ${ruleBasedResult.overallScore}/10 (${ruleBasedResult.overallVerdict})
- Total: $${ruleBasedResult.totalQuoted.toLocaleString()}
- Estimated fair range: $${ruleBasedResult.fairTotalLow.toLocaleString()} - $${ruleBasedResult.fairTotalHigh.toLocaleString()}
- Line items:
${lineItemsSummary}

RESEARCH STEPS:
1. Search for typical costs of each line item in or near ${region.label}
2. Find Reddit/forum discussions about people paying for similar ${category.toLowerCase()} services
3. Look up common overcharging patterns in ${category.toLowerCase()}
4. Check regional cost factors for ${region.label}

After your research, respond with ONLY a JSON object (no markdown wrapping, no explanation outside the JSON) with this structure:
{
  "detailedExplanation": "3-5 paragraphs. Reference the ACTUAL sources you found — include specific data points, quotes from forum users, and pricing data. Cite URLs where possible. Write conversationally.",
  "communityInsights": [
    {
      "source": "Source name (e.g. Reddit r/MechanicAdvice, HomeAdvisor, RepairPal)",
      "snippet": "What you found — specific quote, data point, or user report. Include the URL if you have it.",
      "sentiment": "supports_price" | "price_too_high" | "neutral"
    }
  ],
  "scoreJustification": "Concrete reasoning based on your research for the fairness score.",
  "regionalContext": "How pricing in ${region.label} (zip ${zipCode}) compares based on what you found.",
  "watchOutFor": ["Specific warnings based on what you found in your research about this service type"],
  "lineItemExplanations": {
    "item name": "What your research found about the fair price for this specific item. Cite sources."
  }
}

Include 3-6 community insights based on real sources you found. For lineItemExplanations, include every line item from the quote.`;

  try {
    const client = new Anthropic({ apiKey });

    // Start the agentic conversation
    const messages: MessageParam[] = [
      { role: "user", content: userPrompt },
    ];

    let response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: hasSearchKey ? AGENT_TOOLS : [],
      messages,
    });

    // Agentic loop — keep going while Claude wants to use tools
    let turns = 0;
    while (response.stop_reason === "tool_use" && turns < MAX_AGENT_TURNS) {
      turns++;

      // Process tool calls
      const toolResults: ContentBlock[] = [];
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use"
      );

      for (const toolUse of toolUseBlocks) {
        let result: string;

        if (toolUse.name === "search_web") {
          const input = toolUse.input as { query: string };
          console.log(`[QuoteCheck Agent] Searching: "${input.query}"`);
          const results = await webSearch(input.query);
          result =
            results.length > 0
              ? results
                  .map(
                    (r, i) =>
                      `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`
                  )
                  .join("\n\n")
              : "No results found for this query.";
        } else if (toolUse.name === "read_page") {
          const input = toolUse.input as { url: string };
          console.log(`[QuoteCheck Agent] Reading: ${input.url}`);
          const page = await fetchPage(input.url);
          result = `Title: ${page.title}\nURL: ${page.url}\n\n${page.text}`;
        } else {
          result = "Unknown tool.";
        }

        toolResults.push({
          type: "tool_result" as unknown as "text",
          tool_use_id: toolUse.id,
          content: result,
        } as unknown as ContentBlock);
      }

      // Continue the conversation with tool results
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: toolResults as unknown as string,
      });

      response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: hasSearchKey ? AGENT_TOOLS : [],
        messages,
      });
    }

    console.log(
      `[QuoteCheck Agent] Completed in ${turns} tool-use turns`
    );

    // Extract the final text response
    const textBlock = response.content.find(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text"
    );
    if (!textBlock) return null;

    let jsonStr = textBlock.text.trim();
    // Strip markdown wrapping if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    // Sometimes Claude adds text before the JSON
    const jsonStart = jsonStr.indexOf("{");
    const jsonEnd = jsonStr.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(jsonStr) as AIAnalysisResult;
    return parsed;
  } catch (error) {
    console.error("AI agent analysis failed:", error);
    return null;
  }
}

// ── Merge AI results into the rule-based analysis ───────────

export function mergeAIAnalysis(
  ruleBasedResult: QuoteAnalysis,
  aiResult: AIAnalysisResult
): QuoteAnalysis {
  const enhancedLineItems: LineItemAnalysis[] = ruleBasedResult.lineItems.map(
    (item) => {
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

  for (const [key, val] of Object.entries(explanations)) {
    if (key.toLowerCase() === lower) return val;
  }

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
