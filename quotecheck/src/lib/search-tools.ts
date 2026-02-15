/**
 * Web search and page fetching tools for the AI agent.
 *
 * Search providers (in priority order):
 *   1. Brave Search API (BRAVE_SEARCH_API_KEY) — free tier: 1000 queries/month
 *   2. Fallback: no search, Claude uses training data only
 *
 * Page fetching uses plain fetch + HTML-to-text extraction.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface PageContent {
  url: string;
  title: string;
  text: string;
  truncated: boolean;
}

// ── Web Search ──────────────────────────────────────────────

export async function webSearch(
  query: string,
  numResults: number = 8
): Promise<SearchResult[]> {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;

  if (braveKey) {
    return braveSearch(query, numResults, braveKey);
  }

  // No search API available
  console.warn("No search API key found. AI will use training data only.");
  return [];
}

async function braveSearch(
  query: string,
  count: number,
  apiKey: string
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: String(count),
    text_decorations: "false",
    search_lang: "en",
  });

  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    }
  );

  if (!res.ok) {
    console.error("Brave search failed:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const results: SearchResult[] = (data.web?.results || []).map(
    (r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    })
  );

  return results;
}

// ── Page Fetcher ────────────────────────────────────────────

export async function fetchPage(url: string): Promise<PageContent> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; QuoteCheck/1.0; +https://quotecheck.app)",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { url, title: "", text: `Failed to fetch: HTTP ${res.status}`, truncated: false };
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

    // Convert HTML to plain text
    const text = htmlToText(html);

    // Truncate to ~6000 chars to keep context manageable
    const maxLen = 6000;
    const truncated = text.length > maxLen;
    const finalText = truncated ? text.slice(0, maxLen) + "\n[...truncated]" : text;

    return { url, title, text: finalText, truncated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { url, title: "", text: `Failed to fetch: ${message}`, truncated: false };
  }
}

function htmlToText(html: string): string {
  let text = html;

  // Remove script and style blocks
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Block elements → newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|br\s*\/?)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");

  // Clean whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
}
