import Database from "better-sqlite3";
import path from "path";
import type { QuoteAnalysis } from "./types";

// ── Database path ────────────────────────────────────────────
const DB_PATH = path.join(process.cwd(), "quotecheck.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

// ── Schema ───────────────────────────────────────────────────

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      quote_text TEXT NOT NULL,
      service_category TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      region_label TEXT,
      overall_score INTEGER NOT NULL,
      overall_verdict TEXT NOT NULL,
      total_quoted REAL NOT NULL,
      fair_total_low REAL NOT NULL,
      fair_total_high REAL NOT NULL,
      potential_savings REAL NOT NULL,
      has_ai_analysis INTEGER NOT NULL DEFAULT 0,
      full_result TEXT NOT NULL,
      -- Searchable fields for fuzzy matching
      normalized_items TEXT NOT NULL,
      search_hash TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_category ON analyses(service_category);
    CREATE INDEX IF NOT EXISTS idx_analyses_zip ON analyses(zip_code);
    CREATE INDEX IF NOT EXISTS idx_analyses_hash ON analyses(search_hash);
    CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analyses_score ON analyses(overall_score);

    CREATE TABLE IF NOT EXISTS price_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      quoted_price REAL NOT NULL,
      fair_price_low REAL NOT NULL,
      fair_price_high REAL NOT NULL,
      status TEXT NOT NULL,
      service_category TEXT NOT NULL,
      zip_code TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_price_points_name ON price_points(normalized_name);
    CREATE INDEX IF NOT EXISTS idx_price_points_category ON price_points(service_category);
  `);
}

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

// ── Store an analysis ────────────────────────────────────────

export function storeAnalysis(
  quoteText: string,
  serviceCategory: string,
  zipCode: string,
  regionLabel: string,
  result: QuoteAnalysis
): number {
  const db = getDb();

  const keywords = extractKeywords(quoteText);
  const normalizedItems = result.lineItems
    .map((li) => normalizeItemName(li.item))
    .join("|");
  const searchHash = makeSearchHash(serviceCategory, keywords);

  const stmt = db.prepare(`
    INSERT INTO analyses (
      quote_text, service_category, zip_code, region_label,
      overall_score, overall_verdict, total_quoted,
      fair_total_low, fair_total_high, potential_savings,
      has_ai_analysis, full_result, normalized_items, search_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    quoteText,
    serviceCategory,
    zipCode,
    regionLabel,
    result.overallScore,
    result.overallVerdict,
    result.totalQuoted,
    result.fairTotalLow,
    result.fairTotalHigh,
    result.potentialSavings,
    result.aiAnalysis?.poweredByAi ? 1 : 0,
    JSON.stringify(result),
    normalizedItems,
    searchHash
  );

  const analysisId = info.lastInsertRowid as number;

  const priceStmt = db.prepare(`
    INSERT INTO price_points (
      analysis_id, item_name, normalized_name, quoted_price,
      fair_price_low, fair_price_high, status, service_category, zip_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const li of result.lineItems) {
    priceStmt.run(
      analysisId,
      li.item,
      normalizeItemName(li.item),
      li.quotedPrice,
      li.fairPriceLow,
      li.fairPriceHigh,
      li.status,
      serviceCategory,
      zipCode
    );
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

const CACHE_MAX_AGE_HOURS = 72; // Cache valid for 3 days

export function findCachedAnalysis(
  quoteText: string,
  serviceCategory: string,
  zipCode: string
): CacheMatch | null {
  const db = getDb();
  const keywords = extractKeywords(quoteText);
  const searchHash = makeSearchHash(serviceCategory, keywords);

  // 1. Try exact hash match in same zip prefix (first 3 digits = same metro area)
  const zipPrefix = zipCode.slice(0, 3);

  const exactRows = db
    .prepare(
      `SELECT full_result, created_at, zip_code,
              (julianday('now') - julianday(created_at)) * 24 as age_hours
       FROM analyses
       WHERE search_hash = ? AND zip_code LIKE ? || '%' AND has_ai_analysis = 1
       ORDER BY age_hours ASC
       LIMIT 1`
    )
    .all(searchHash, zipPrefix) as Array<{
    full_result: string;
    created_at: string;
    zip_code: string;
    age_hours: number;
  }>;

  if (exactRows.length > 0 && exactRows[0].age_hours < CACHE_MAX_AGE_HOURS) {
    return {
      result: JSON.parse(exactRows[0].full_result),
      matchType: "exact",
      similarity: 1.0,
      ageHours: Math.round(exactRows[0].age_hours),
      originalZip: exactRows[0].zip_code,
    };
  }

  // 2. Fuzzy match: find analyses with overlapping keywords in same category
  const normalizedItems = normalizeText(quoteText);
  const rows = db
    .prepare(
      `SELECT full_result, created_at, zip_code, normalized_items, search_hash,
              (julianday('now') - julianday(created_at)) * 24 as age_hours
       FROM analyses
       WHERE service_category = ? AND has_ai_analysis = 1
         AND age_hours < ?
       ORDER BY age_hours ASC
       LIMIT 50`
    )
    .all(serviceCategory, CACHE_MAX_AGE_HOURS) as Array<{
    full_result: string;
    created_at: string;
    zip_code: string;
    normalized_items: string;
    search_hash: string;
    age_hours: number;
  }>;

  let bestMatch: CacheMatch | null = null;
  let bestSimilarity = 0;

  for (const row of rows) {
    const cachedKeywords = row.search_hash.split(":")[1]?.split(",") || [];
    const overlap = keywords.filter((k) =>
      cachedKeywords.some((ck) => ck.includes(k) || k.includes(ck))
    ).length;
    const maxLen = Math.max(keywords.length, cachedKeywords.length, 1);
    const similarity = overlap / maxLen;

    // Also check item-level similarity
    const cachedItems = row.normalized_items.split("|");
    const queryItems = normalizedItems.split(/[,\n|]/).map((s) => s.trim());
    const itemOverlap = queryItems.filter((qi) =>
      cachedItems.some(
        (ci) =>
          ci.includes(qi) ||
          qi.includes(ci) ||
          wordOverlap(qi, ci) > 0.5
      )
    ).length;
    const itemSimilarity =
      itemOverlap / Math.max(queryItems.length, cachedItems.length, 1);

    const combinedSimilarity = similarity * 0.6 + itemSimilarity * 0.4;

    if (combinedSimilarity > 0.55 && combinedSimilarity > bestSimilarity) {
      bestSimilarity = combinedSimilarity;
      bestMatch = {
        result: JSON.parse(row.full_result),
        matchType: "similar",
        similarity: Math.round(combinedSimilarity * 100) / 100,
        ageHours: Math.round(row.age_hours),
        originalZip: row.zip_code,
      };
    }
  }

  return bestMatch;
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

export function queryHistory(
  query: HistoricalQuery
): { results: HistoricalResult[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (query.category) {
    conditions.push("a.service_category = ?");
    params.push(query.category);
  }
  if (query.zipCode) {
    conditions.push("a.zip_code LIKE ? || '%'");
    params.push(query.zipCode.slice(0, 3));
  }
  if (query.search) {
    conditions.push(
      "(a.normalized_items LIKE '%' || ? || '%' OR a.quote_text LIKE '%' || ? || '%')"
    );
    const normalized = normalizeText(query.search);
    params.push(normalized, normalized);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderMap: Record<string, string> = {
    recent: "a.created_at DESC",
    score_high: "a.overall_score DESC",
    score_low: "a.overall_score ASC",
    price_high: "a.total_quoted DESC",
    price_low: "a.total_quoted ASC",
  };
  const orderBy = orderMap[query.sortBy || "recent"];

  const limit = Math.min(query.limit || 20, 100);
  const offset = query.offset || 0;

  const countRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM analyses a ${where}`)
    .get(...params) as { cnt: number };

  const rows = db
    .prepare(
      `SELECT
        a.id, a.created_at, a.service_category, a.zip_code, a.region_label,
        a.overall_score, a.overall_verdict, a.total_quoted,
        a.fair_total_low, a.fair_total_high, a.potential_savings,
        a.has_ai_analysis, a.normalized_items
       FROM analyses a
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<{
    id: number;
    created_at: string;
    service_category: string;
    zip_code: string;
    region_label: string;
    overall_score: number;
    overall_verdict: string;
    total_quoted: number;
    fair_total_low: number;
    fair_total_high: number;
    potential_savings: number;
    has_ai_analysis: number;
    normalized_items: string;
  }>;

  const results: HistoricalResult[] = rows.map((r) => ({
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
    hasAiAnalysis: r.has_ai_analysis === 1,
    lineItemCount: r.normalized_items.split("|").filter(Boolean).length,
    topItem: r.normalized_items.split("|")[0] || "Unknown",
  }));

  return { results, total: countRow.cnt };
}

// ── Get full stored analysis by ID ───────────────────────────

export function getStoredAnalysis(id: number): QuoteAnalysis | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT full_result FROM analyses WHERE id = ?`)
    .get(id) as { full_result: string } | undefined;
  return row ? JSON.parse(row.full_result) : null;
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

export function getCategoryStats(): CategoryStats[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        service_category,
        COUNT(*) as total,
        ROUND(AVG(overall_score), 1) as avg_score,
        ROUND(AVG(total_quoted), 0) as avg_quoted,
        ROUND(AVG(potential_savings), 0) as avg_savings,
        SUM(CASE WHEN overall_verdict IN ('great_deal', 'fair') THEN 1 ELSE 0 END) as fair_count,
        SUM(CASE WHEN overall_verdict IN ('overpriced', 'ripoff') THEN 1 ELSE 0 END) as overpriced_count
       FROM analyses
       GROUP BY service_category
       ORDER BY total DESC`
    )
    .all() as Array<{
    service_category: string;
    total: number;
    avg_score: number;
    avg_quoted: number;
    avg_savings: number;
    fair_count: number;
    overpriced_count: number;
  }>;

  return rows.map((r) => ({
    category: r.service_category,
    totalAnalyses: r.total,
    avgScore: r.avg_score,
    avgQuoted: r.avg_quoted,
    avgSavings: r.avg_savings,
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

export function getCommunityPrices(
  category?: string,
  search?: string
): CommunityPrice[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (category) {
    conditions.push("service_category = ?");
    params.push(category);
  }
  if (search) {
    conditions.push("normalized_name LIKE '%' || ? || '%'");
    params.push(normalizeText(search));
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT
        normalized_name,
        MIN(item_name) as item_name,
        ROUND(AVG(quoted_price), 0) as avg_quoted,
        MIN(quoted_price) as min_quoted,
        MAX(quoted_price) as max_quoted,
        ROUND(AVG(fair_price_low), 0) as avg_fair_low,
        ROUND(AVG(fair_price_high), 0) as avg_fair_high,
        COUNT(*) as data_points,
        service_category
       FROM price_points
       ${where}
       GROUP BY normalized_name, service_category
       HAVING data_points >= 1
       ORDER BY data_points DESC
       LIMIT 100`
    )
    .all(...params) as Array<{
    normalized_name: string;
    item_name: string;
    avg_quoted: number;
    min_quoted: number;
    max_quoted: number;
    avg_fair_low: number;
    avg_fair_high: number;
    data_points: number;
    service_category: string;
  }>;

  return rows.map((r) => ({
    itemName: r.item_name,
    avgQuoted: r.avg_quoted,
    minQuoted: r.min_quoted,
    maxQuoted: r.max_quoted,
    avgFairLow: r.avg_fair_low,
    avgFairHigh: r.avg_fair_high,
    dataPoints: r.data_points,
    category: r.service_category,
  }));
}
