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

const REPUTATION_TOOLS: Array<Tool | any> = [
  {
    name: "read_page",
    description:
      "Read the content of a web page — useful for reading BBB profiles, Google review pages, Yelp listings, or contractor license databases.",
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
  {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 5,
  },
];

const REPUTATION_SYSTEM = `You are a business reputation investigator. Your job is to ACTUALLY RESEARCH a specific business using web search and provide a real, evidence-based reputation report.

YOUR PROCESS:
1. **Search the web** for the business by name and location
2. Look for their Google reviews, Yelp page, BBB profile, and any news/complaints
3. Check if they have a website, how long they've been operating, licensing info
4. Read actual review pages to get real ratings, review counts, and customer feedback
5. Look for any complaints, lawsuits, or red flags specific to THIS business
6. Synthesize everything into an honest, evidence-based report

IMPORTANT:
- You MUST search for the actual business — do NOT give generic industry advice
- Include real ratings, real review counts, and real URLs you find
- If you can't find the business online, say so honestly — that itself is a red flag
- Quote real customer reviews when possible
- Be direct and honest — if the business looks sketchy, say so

After your research, respond with ONLY a JSON object (no markdown wrapping):
{
  "businessName": "The business name as found online",
  "overallRating": "excellent" | "good" | "mixed" | "poor" | "unknown",
  "ratingScore": 1-10,
  "summary": "2-3 sentence summary based on what you ACTUALLY found online about this specific business",
  "reviewSources": [
    {
      "platform": "Google / Yelp / BBB / etc.",
      "rating": "4.5/5 stars (or whatever you found)",
      "reviewCount": "123 reviews (actual number)",
      "url": "actual URL if found",
      "snippet": "A real review excerpt or summary of what reviewers say"
    }
  ],
  "complaints": ["Real complaints found about THIS business, or common issues if none found"],
  "positives": ["Real positive things found about THIS business"],
  "licenseInfo": "What you found about their licensing/certification status",
  "yearsInBusiness": "How long they've been operating based on what you found",
  "warningFlags": ["Any specific red flags found for THIS business"],
  "recommendation": "Specific recommendation based on your research findings"
}`;

// ── Reputation Lookup ────────────────────────────────────────

export async function lookupReputation(
  businessName: string,
  location: string,
  category: string
): Promise<ReputationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const userPrompt = `Research the reputation of this specific business:

Business Name: ${businessName}
Location: ${location}
Service Type: ${category.replace(/_/g, " ")}

SEARCH STEPS:
1. Search for "${businessName} ${location} reviews" to find their online presence
2. Look for their Google reviews, Yelp page, and BBB profile
3. Search for "${businessName} complaints" or "${businessName} scam" to check for issues
4. Check if they have a website and how established they are
5. Look for any licensing or certification information

Give me a REAL report based on what you actually find — not generic advice.`;

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
