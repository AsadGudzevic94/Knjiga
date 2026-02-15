import Anthropic from "@anthropic-ai/sdk";
import { webSearch, fetchPage } from "./search-tools";
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
    name: "search_web",
    description:
      "Search the web for business reviews, BBB profiles, complaints, and license information. Use specific queries like 'Smith Plumbing Austin TX reviews', 'Smith Plumbing BBB complaints', 'Smith Plumbing license Texas'.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query — be specific with business name and location.",
        },
      },
      required: ["query"],
    },
  },
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
];

const REPUTATION_SYSTEM = `You are a business reputation researcher. Your job is to thoroughly investigate a business using web search to determine if they are trustworthy.

RESEARCH PROCESS:
1. Search for the business name + location + "reviews"
2. Search for the business on BBB (Better Business Bureau)
3. Search for complaints or lawsuits: "[business name] complaints" / "[business name] scam"
4. Check license/certification if applicable
5. Read 2-3 of the most relevant review pages

BE THOROUGH. Do at least 4-5 searches and read at least 2 pages.

After research, respond with ONLY a JSON object:
{
  "businessName": "Verified business name",
  "overallRating": "excellent" | "good" | "mixed" | "poor" | "unknown",
  "ratingScore": 1-10,
  "summary": "2-3 sentence summary of what you found about this business",
  "reviewSources": [
    {
      "platform": "Google / Yelp / BBB / etc.",
      "rating": "4.5/5",
      "reviewCount": "123 reviews",
      "url": "URL if found",
      "snippet": "Key takeaway from reviews on this platform"
    }
  ],
  "complaints": ["Specific complaint patterns you found — cite sources"],
  "positives": ["Specific positive patterns — cite sources"],
  "licenseInfo": "What you found about their license/certification status",
  "yearsInBusiness": "How long they've been operating, if found",
  "warningFlags": ["Any red flags discovered during research"],
  "recommendation": "Your honest recommendation based on research"
}`;

// ── Reputation Lookup ────────────────────────────────────────

export async function lookupReputation(
  businessName: string,
  location: string,
  category: string
): Promise<ReputationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasSearchKey = !!process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return null;

  const searchInstructions = hasSearchKey
    ? "You HAVE web search tools. USE THEM to research this business. Do at least 4 searches."
    : "Web search is not available. Provide the best assessment you can based on your training data. Be transparent about this limitation.";

  const userPrompt = `Research this ${category.replace(/_/g, " ")} business:

Business Name: ${businessName}
Location: ${location}

${searchInstructions}

Search for:
1. "${businessName} ${location} reviews"
2. "${businessName} BBB" or "${businessName} Better Business Bureau"
3. "${businessName} complaints" or "${businessName} ${location} scam"
4. "${businessName} license" or contractor license lookup for their state
5. Read their Google/Yelp/BBB profile pages

Give me the full picture — the good, the bad, and the ugly.`;

  try {
    const client = new Anthropic({ apiKey });
    const messages: MessageParam[] = [
      { role: "user", content: userPrompt },
    ];

    let response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: REPUTATION_SYSTEM,
      tools: hasSearchKey ? REPUTATION_TOOLS : [],
      messages,
    });

    let turns = 0;
    while (response.stop_reason === "tool_use" && turns < 10) {
      turns++;
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock =>
          block.type === "tool_use"
      );

      const toolResults: ContentBlock[] = [];
      for (const toolUse of toolUseBlocks) {
        let result: string;
        if (toolUse.name === "search_web") {
          const input = toolUse.input as { query: string };
          console.log(`[Reputation Agent] Searching: "${input.query}"`);
          const results = await webSearch(input.query);
          result =
            results.length > 0
              ? results
                  .map(
                    (r, i) =>
                      `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`
                  )
                  .join("\n\n")
              : "No results found.";
        } else if (toolUse.name === "read_page") {
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
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: REPUTATION_SYSTEM,
        tools: hasSearchKey ? REPUTATION_TOOLS : [],
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
