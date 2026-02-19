import { createClient } from "@supabase/supabase-js";
import type { QuoteAnalysis } from "./types";

// Service role client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Normalization helpers ────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(the|a|an|and|or|for|of|to|in|on|with|my)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "for", "of", "to", "in", "on", "with",
    "my", "i", "me", "we", "our", "is", "was", "are", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "want", "get",
    "got", "per", "each", "about", "from", "this", "that", "it", "they",
    "he", "she", "his", "her", "its", "them", "their", "up", "out",
  ]);
  return normalized
    .split(" ")
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function makeSearchHash(category: string, keywords: string[]): string {
  const sorted = [...new Set(keywords)].sort();
  return `${category}:${sorted.join(",")}`;
}

function wordOverlap(a: string, b: string): number {
  const wordsA = a.split(/\s+/).filter((w) => w.length > 2);
  const wordsB = b.split(/\s+/).filter((w) => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const overlap = wordsA.filter((w) =>
    wordsB.some((wb) => wb.includes(w) || w.includes(wb))
  ).length;
  return overlap / Math.max(wordsA.length, wordsB.length);
}

// ── Store an analysis ────────────────────────────────────────

export async function storeAnalysis(
  quoteText: string,
  serviceCategory: string,
  zipCode: string,
  regionLabel: string,
  result: QuoteAnalysis,
  userId?: string,
  vendorName?: string
): Promise<number> {
  const keywords = extractKeywords(quoteText);
  const normalizedItems = result.lineItems
    .map((li) => normalizeItemName(li.item))
    .join("|");
  const searchHash = makeSearchHash(serviceCategory, keywords);

  const { data: analysis, error: analysisError } = await supabase
    .from("community_analyses")
    .insert({
      quote_text: quoteText,
      service_category: serviceCategory,
      zip_code: zipCode,
      region_label: regionLabel,
      overall_score: result.overallScore,
      overall_verdict: result.overallVerdict,
      total_quoted: result.totalQuoted,
      fair_total_low: result.fairTotalLow,
      fair_total_high: result.fairTotalHigh,
      potential_savings: result.potentialSavings,
      has_ai_analysis: !!result.aiAnalysis?.poweredByAi,
      full_result: result,
      normalized_items: normalizedItems,
      search_hash: searchHash,
      user_id: userId || null,
      vendor_name: vendorName || null,
    })
    .select("id")
    .single();

  if (analysisError) {
    console.error("Failed to store analysis:", analysisError);
    throw analysisError;
  }

  const analysisId = analysis.id;

  // Insert price points
  const pricePoints = result.lineItems.map((li) => ({
    analysis_id: analysisId,
    item_name: li.item,
    normalized_name: normalizeItemName(li.item),
    quoted_price: li.quotedPrice,
    fair_price_low: li.fairPriceLow,
    fair_price_high: li.fairPriceHigh,
    status: li.status,
    service_category: serviceCategory,
    zip_code: zipCode,
  }));

  if (pricePoints.length > 0) {
    const { error: ppError } = await supabase
      .from("community_price_points")
      .insert(pricePoints);

    if (ppError) {
      console.error("Failed to store price points:", ppError);
    }
  }

  return analysisId;
}

// ── Find cached / similar analysis ───────────────────────────

export interface CacheMatch {
  result: QuoteAnalysis;
  matchType: "exact" | "similar";
  similarity: number;
  ageHours: number;
  originalZip: string;
}

const CACHE_MAX_AGE_HOURS = 72;

export async function findCachedAnalysis(
  quoteText: string,
  serviceCategory: string,
  zipCode: string
): Promise<CacheMatch | null> {
  const keywords = extractKeywords(quoteText);
  const searchHash = makeSearchHash(serviceCategory, keywords);
  const zipPrefix = zipCode.slice(0, 3);
  const cutoffDate = new Date(Date.now() - CACHE_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();

  // 1. Try exact hash match in same zip prefix
  const { data: exactRows } = await supabase
    .from("community_analyses")
    .select("full_result, created_at, zip_code")
    .eq("search_hash", searchHash)
    .like("zip_code", `${zipPrefix}%`)
    .eq("has_ai_analysis", true)
    .gte("created_at", cutoffDate)
    .order("created_at", { ascending: false })
    .limit(1);

  if (exactRows && exactRows.length > 0) {
    const row = exactRows[0];
    const ageHours = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
    return {
      result: row.full_result as unknown as QuoteAnalysis,
      matchType: "exact",
      similarity: 1.0,
      ageHours: Math.round(ageHours),
      originalZip: row.zip_code,
    };
  }

  // 2. Fuzzy match: find analyses with overlapping keywords in same category
  const { data: rows } = await supabase
    .from("community_analyses")
    .select("full_result, created_at, zip_code, normalized_items, search_hash")
    .eq("service_category", serviceCategory)
    .eq("has_ai_analysis", true)
    .gte("created_at", cutoffDate)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!rows || rows.length === 0) return null;

  const normalizedItems = normalizeText(quoteText);
  let bestMatch: CacheMatch | null = null;
  let bestSimilarity = 0;

  for (const row of rows) {
    const cachedKeywords = row.search_hash.split(":")[1]?.split(",") || [];
    const overlap = keywords.filter((k) =>
      cachedKeywords.some((ck: string) => ck.includes(k) || k.includes(ck))
    ).length;
    const maxLen = Math.max(keywords.length, cachedKeywords.length, 1);
    const similarity = overlap / maxLen;

    const cachedItems = row.normalized_items.split("|");
    const queryItems = normalizedItems.split(/[,\n|]/).map((s: string) => s.trim());
    const itemOverlap = queryItems.filter((qi: string) =>
      cachedItems.some(
        (ci: string) =>
          ci.includes(qi) ||
          qi.includes(ci) ||
          wordOverlap(qi, ci) > 0.5
      )
    ).length;
    const itemSimilarity =
      itemOverlap / Math.max(queryItems.length, cachedItems.length, 1);

    const combinedSimilarity = similarity * 0.6 + itemSimilarity * 0.4;

    if (combinedSimilarity > 0.55 && combinedSimilarity > bestSimilarity) {
      const ageHours = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
      bestSimilarity = combinedSimilarity;
      bestMatch = {
        result: row.full_result as unknown as QuoteAnalysis,
        matchType: "similar",
        similarity: Math.round(combinedSimilarity * 100) / 100,
        ageHours: Math.round(ageHours),
        originalZip: row.zip_code,
      };
    }
  }

  return bestMatch;
}

// ── Query historical data ────────────────────────────────────

export interface HistoricalQuery {
  category?: string;
  zipCode?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "recent" | "score_high" | "score_low" | "price_high" | "price_low";
}

export interface HistoricalResult {
  id: number;
  createdAt: string;
  serviceCategory: string;
  zipCode: string;
  regionLabel: string;
  overallScore: number;
  overallVerdict: string;
  totalQuoted: number;
  fairTotalLow: number;
  fairTotalHigh: number;
  potentialSavings: number;
  hasAiAnalysis: boolean;
  lineItemCount: number;
  topItem: string;
}

export async function queryHistory(
  query: HistoricalQuery
): Promise<{ results: HistoricalResult[]; total: number }> {
  const limit = Math.min(query.limit || 20, 100);
  const offset = query.offset || 0;

  const orderMap: Record<string, { column: string; ascending: boolean }> = {
    recent: { column: "created_at", ascending: false },
    score_high: { column: "overall_score", ascending: false },
    score_low: { column: "overall_score", ascending: true },
    price_high: { column: "total_quoted", ascending: false },
    price_low: { column: "total_quoted", ascending: true },
  };
  const order = orderMap[query.sortBy || "recent"];

  // Build query
  let q = supabase
    .from("community_analyses")
    .select("id, created_at, service_category, zip_code, region_label, overall_score, overall_verdict, total_quoted, fair_total_low, fair_total_high, potential_savings, has_ai_analysis, normalized_items", { count: "exact" });

  if (query.category) {
    q = q.eq("service_category", query.category);
  }
  if (query.zipCode) {
    q = q.like("zip_code", `${query.zipCode.slice(0, 3)}%`);
  }
  if (query.search) {
    const normalized = normalizeText(query.search);
    q = q.or(`normalized_items.ilike.%${normalized}%,quote_text.ilike.%${normalized}%`);
  }

  q = q.order(order.column, { ascending: order.ascending });
  q = q.range(offset, offset + limit - 1);

  const { data: rows, count, error } = await q;

  if (error) {
    console.error("History query error:", error);
    return { results: [], total: 0 };
  }

  const results: HistoricalResult[] = (rows || []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    serviceCategory: r.service_category,
    zipCode: r.zip_code,
    regionLabel: r.region_label || "",
    overallScore: r.overall_score,
    overallVerdict: r.overall_verdict,
    totalQuoted: r.total_quoted,
    fairTotalLow: r.fair_total_low,
    fairTotalHigh: r.fair_total_high,
    potentialSavings: r.potential_savings,
    hasAiAnalysis: r.has_ai_analysis,
    lineItemCount: r.normalized_items.split("|").filter(Boolean).length,
    topItem: r.normalized_items.split("|")[0] || "Unknown",
  }));

  return { results, total: count || 0 };
}

// ── Get full stored analysis by ID ───────────────────────────

export async function getStoredAnalysis(id: number): Promise<QuoteAnalysis | null> {
  const { data, error } = await supabase
    .from("community_analyses")
    .select("full_result")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data.full_result as unknown as QuoteAnalysis;
}

// ── Aggregate stats ──────────────────────────────────────────

export interface CategoryStats {
  category: string;
  totalAnalyses: number;
  avgScore: number;
  avgQuoted: number;
  avgSavings: number;
  fairCount: number;
  overpricedCount: number;
}

export async function getCategoryStats(): Promise<CategoryStats[]> {
  const { data, error } = await supabase.rpc("get_category_stats");

  if (error) {
    console.error("Category stats error:", error);
    return [];
  }

  return (data || []).map((r: { category: string; total_analyses: number; avg_score: number; avg_quoted: number; avg_savings: number; fair_count: number; overpriced_count: number }) => ({
    category: r.category,
    totalAnalyses: r.total_analyses,
    avgScore: Number(r.avg_score),
    avgQuoted: Number(r.avg_quoted),
    avgSavings: Number(r.avg_savings),
    fairCount: r.fair_count,
    overpricedCount: r.overpriced_count,
  }));
}

// ── Price point lookup (community prices) ────────────────────

export interface CommunityPrice {
  itemName: string;
  avgQuoted: number;
  minQuoted: number;
  maxQuoted: number;
  avgFairLow: number;
  avgFairHigh: number;
  dataPoints: number;
  category: string;
}

export async function getCommunityPrices(
  category?: string,
  search?: string
): Promise<CommunityPrice[]> {
  const { data, error } = await supabase.rpc("get_community_prices", {
    p_category: category || null,
    p_search: search ? normalizeText(search) : null,
  });

  if (error) {
    console.error("Community prices error:", error);
    return [];
  }

  return (data || []).map((r: { item_name: string; avg_quoted: number; min_quoted: number; max_quoted: number; avg_fair_low: number; avg_fair_high: number; data_points: number; category: string }) => ({
    itemName: r.item_name,
    avgQuoted: Number(r.avg_quoted),
    minQuoted: Number(r.min_quoted),
    maxQuoted: Number(r.max_quoted),
    avgFairLow: Number(r.avg_fair_low),
    avgFairHigh: Number(r.avg_fair_high),
    dataPoints: r.data_points,
    category: r.category,
  }));
}
