import Anthropic from "@anthropic-ai/sdk";
import { fetchPage } from "./search-tools";
import type { Tool, MessageParam, ContentBlock } from "@anthropic-ai/sdk/resources/messages";

// ── Types ────────────────────────────────────────────────────

export interface ReputationResult {
  businessName: string;
  overallRating: "excellent" | "good" | "mixed" | "poor" | "unknown";
  ratingScore: number; // 1-10
  summary: string;
  reviewSources: ReviewSource[];
  complaints: string[];
  positives: string[];
  licenseInfo: string;
  yearsInBusiness: string;
  warningFlags: string[];
  recommendation: string;
}

export interface ReviewSource {
  platform: string;
  rating: string;
  reviewCount: string;
  url?: string;
  snippet: string;
}

// ── Agent Tools ──────────────────────────────────────────────

const REPUTATION_TOOLS: Tool[] = [
  {
    name: "read_page",
    description:
      "Read the content of a web page — useful for reading BBB profiles, Google review pages, Yelp listings, or contractor license databases when a URL is provided.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The full URL to read.",
        },
      },
      required: ["url"],
    },
  },
];

const REPUTATION_SYSTEM = `You are a business reputation analyst. Your job is to provide a risk assessment of a business based on typical red flags, common industry practices, and general business evaluation criteria.

ANALYSIS PROCESS:
1. Consider typical reputation patterns for this type of business
2. Identify common warning signs in the industry
3. Provide general guidance on what to look for
4. Recommend due diligence steps the customer should take

BE THOROUGH AND HONEST about the limitations of this analysis.

After analysis, respond with ONLY a JSON object:
{
  "businessName": "Verified business name",
  "overallRating": "excellent" | "good" | "mixed" | "poor" | "unknown",
  "ratingScore": 1-10,
  "summary": "2-3 sentence general risk assessment and due diligence guidance",
  "reviewSources": [
    {
      "platform": "Suggested platform to check (Google / Yelp / BBB / etc.)",
      "rating": "Unknown - customer should verify",
      "reviewCount": "Unknown - customer should check",
      "url": "",
      "snippet": "What to look for on this platform"
    }
  ],
  "complaints": ["Common complaint patterns in this industry"],
  "positives": ["What to look for as positive signs"],
  "licenseInfo": "Recommend checking license/certification for this business type",
  "yearsInBusiness": "Unknown - recommend asking the business",
  "warningFlags": ["Common red flags to watch for in this industry"],
  "recommendation": "General recommendation on due diligence steps"
}`;

// ── Reputation Lookup ────────────────────────────────────────

export async function lookupReputation(
  businessName: string,
  location: string,
  category: string
): Promise<ReputationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const userPrompt = `Provide a general risk assessment and due diligence guide for this ${category.replace(/_/g, " ")} business:

Business Name: ${businessName}
Location: ${location}

Provide guidance based on:
1. Common red flags in the ${category.replace(/_/g, " ")} industry
2. What platforms the customer should check for reviews (Google, Yelp, BBB, etc.)
3. Typical complaint patterns to watch for
4. License/certification requirements for this business type
5. General due diligence steps the customer should take

Be transparent that this is general guidance, not specific research on this business.`;

  try {
    const client = new Anthropic({ apiKey });
    const messages: MessageParam[] = [
      { role: "user", content: userPrompt },
    ];

    let response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: REPUTATION_SYSTEM,
      tools: REPUTATION_TOOLS,
      messages,
    });

    let turns = 0;
    while (response.stop_reason === "tool_use" && turns < 5) {
      turns++;
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock =>
          block.type === "tool_use"
      );

      const toolResults: ContentBlock[] = [];
      for (const toolUse of toolUseBlocks) {
        let result: string;
        if (toolUse.name === "read_page") {
          const input = toolUse.input as { url: string };
          console.log(`[Reputation Agent] Reading: ${input.url}`);
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

      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: toolResults as unknown as string,
      });

      response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: REPUTATION_SYSTEM,
        tools: REPUTATION_TOOLS,
        messages,
      });
    }

    console.log(`[Reputation Agent] Completed in ${turns} turns`);

    const textBlock = response.content.find(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text"
    );
    if (!textBlock) return null;

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const jsonStart = jsonStr.indexOf("{");
    const jsonEnd = jsonStr.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
    }

    return JSON.parse(jsonStr) as ReputationResult;
  } catch (error) {
    console.error("Reputation lookup failed:", error);
    return null;
  }
}
