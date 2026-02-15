import Anthropic from "@anthropic-ai/sdk";
import type { QuoteAnalysis, CommunityInsight, LineItemAnalysis } from "./types";
import { getRegionalFactor } from "./pricing-data";
import { fetchPage } from "./search-tools";
import type { Tool, MessageParam, ContentBlock } from "@anthropic-ai/sdk/resources/messages";

// ── Tool definitions for the AI agent ───────────────────────

const AGENT_TOOLS: Array<Tool | any> = [
  {
    name: "read_page",
    description:
      "Fetch and read the content of a specific web page — useful for reading pricing guides, forum discussions, or review pages when a URL is provided by the user. Returns the text content of the page.",
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
  {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 5,
  },
];

// ── System prompt ───────────────────────────────────────────

const SYSTEM_PROMPT = `You are QuoteCheck AI — a consumer pricing analysis expert. Your job is to analyze whether a service quote is fair based on REAL, CURRENT pricing data from the web.

You have web search capabilities and one tool:
1. read_page — Read the content of a web page when a specific URL is provided

YOUR ANALYSIS PROCESS:
1. **Search the web** for current pricing data for each service/item in the quote
2. Find real examples from pricing guides, Reddit discussions, consumer forums, and review sites
3. Compare the quoted prices against real market data you find
4. Consider regional pricing factors for the customer's area
5. Identify common overcharging patterns mentioned in consumer discussions
6. Synthesize everything into a comprehensive analysis with specific evidence

BE THOROUGH AND SEARCH-DRIVEN:
- **Always search the web** for current pricing information before analyzing
- Look for Reddit threads, consumer forums, pricing guides, and review sites
- Quote specific sources and real prices you find
- Include actual URLs and snippets from your research
- Be direct and conversational — write like a knowledgeable friend who just researched this for them
- Give specific numbers and ranges based on REAL data you just found, not just general knowledge`;

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

  const region = getRegionalFactor(zipCode);

  const lineItemsSummary = ruleBasedResult.lineItems
    .map(
      (item) =>
        `- "${item.item}": Quoted $${item.quotedPrice}, estimated fair range $${item.fairPriceLow}-$${item.fairPriceHigh} (${item.status})`
    )
    .join("\n");

  const userPrompt = `I need you to analyze this ${category} quote for a customer in zip code ${zipCode} (${region.label} area).

**IMPORTANT: Use web search to find REAL, CURRENT pricing data before analyzing.**

Search for:
- Current ${category} pricing guides and articles
- Reddit discussions about ${category} costs
- Consumer forum threads about fair prices
- Recent reviews mentioning pricing
- Regional cost comparisons for ${region.label}

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

ANALYSIS STEPS:
1. **SEARCH THE WEB** for current ${category.toLowerCase()} pricing in ${region.label}
2. Find real examples of what people are paying (check Reddit, forums, pricing guides)
3. Compare each line item against real market data you find
4. Look for consumer discussions about fair vs overpriced ${category.toLowerCase()} services
5. Gather specific price ranges from multiple sources

After your analysis, respond with ONLY a JSON object (no markdown wrapping, no explanation outside the JSON) with this structure:
{
  "detailedExplanation": "3-5 paragraphs. Provide specific analysis of the pricing based on typical market rates. Explain what's fair, what's questionable, and why. Write conversationally.",
  "communityInsights": [
    {
      "source": "Source type (e.g. Industry standards, Typical market rates, Consumer reports)",
      "snippet": "Key insight about typical pricing or common practices in this service category",
      "sentiment": "supports_price" | "price_too_high" | "neutral"
    }
  ],
  "scoreJustification": "Concrete reasoning based on industry standards and typical market rates for the fairness score.",
  "regionalContext": "How pricing in ${region.label} (zip ${zipCode}) typically compares to national averages.",
  "watchOutFor": ["Specific warnings based on common issues and overcharging patterns in this service type"],
  "lineItemExplanations": {
    "item name": "What typical market rates are for this specific item and whether this quote is fair."
  }
}

Include 3-6 insights based on industry knowledge and typical pricing patterns. For lineItemExplanations, include every line item from the quote.`;

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
      tools: AGENT_TOOLS,
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

        if (toolUse.name === "read_page") {
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
        tools: AGENT_TOOLS,
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
