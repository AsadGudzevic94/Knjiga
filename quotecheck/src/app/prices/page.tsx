"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Sparkles,
} from "lucide-react";

interface CommunityPrice {
  itemName: string;
  avgQuoted: number;
  minQuoted: number;
  maxQuoted: number;
  avgFairLow: number;
  avgFairHigh: number;
  dataPoints: number;
  category: string;
}

interface CategoryStat {
  category: string;
  totalAnalyses: number;
  avgScore: number;
  avgQuoted: number;
  avgSavings: number;
  fairCount: number;
  overpricedCount: number;
}

interface HistoricalResult {
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

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "auto_repair", label: "Auto Repair" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "dental", label: "Dental" },
  { value: "medical", label: "Medical" },
  { value: "home_renovation", label: "Home Renovation" },
  { value: "roofing", label: "Roofing" },
  { value: "hvac", label: "HVAC" },
  { value: "legal", label: "Legal" },
  { value: "wedding", label: "Wedding" },
  { value: "moving", label: "Moving" },
];

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-green-400";
  if (score >= 4) return "text-yellow-400";
  if (score >= 2) return "text-orange-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 8) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 6) return "bg-green-500/10 border-green-500/20";
  if (score >= 4) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 2) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function verdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    great_deal: "Great Deal",
    fair: "Fair",
    slightly_high: "Slightly High",
    overpriced: "Overpriced",
    ripoff: "Rip-off",
  };
  return labels[verdict] || verdict;
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr + "Z");
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function CommunityPricesPage() {
  const [activeTab, setActiveTab] = useState<"prices" | "history" | "stats">(
    "prices"
  );
  const [prices, setPrices] = useState<CommunityPrice[]>([]);
  const [history, setHistory] = useState<HistoricalResult[]>([]);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<Record<string, unknown> | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("q", search);
    const res = await fetch(`/api/community-prices?${params}`);
    const data = await res.json();
    setPrices(data);
    setLoading(false);
  }, [category, search]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("q", search);
    params.set("sort", sortBy);
    params.set("limit", "25");
    const res = await fetch(`/api/history?${params}`);
    const data = await res.json();
    setHistory(data.results || []);
    setHistoryTotal(data.total || 0);
    setLoading(false);
  }, [category, search, sortBy]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/community-prices?view=stats");
    const data = await res.json();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "prices") fetchPrices();
    else if (activeTab === "history") fetchHistory();
    else if (activeTab === "stats") fetchStats();
  }, [activeTab, fetchPrices, fetchHistory, fetchStats]);

  const loadFullAnalysis = async (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
      setExpandedAnalysis(null);
      return;
    }
    setExpandedRow(id);
    const res = await fetch(`/api/history?id=${id}`);
    const data = await res.json();
    setExpandedAnalysis(data);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
          <Users className="w-4 h-4" />
          Community Price Database
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          What Others Are{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Actually Paying
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Every quote analyzed on QuoteCheck builds our community pricing
          database. Browse real prices, see trends, and know the fair rate
          before you negotiate.
        </p>
      </section>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl w-fit mx-auto">
          {[
            { key: "prices", label: "Community Prices", icon: DollarSign },
            { key: "history", label: "Recent Analyses", icon: Clock },
            { key: "stats", label: "Category Stats", icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {activeTab !== "stats" && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search services (e.g. brake pads, water heater, root canal...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (activeTab === "prices") fetchPrices();
                    else fetchHistory();
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-10 pr-8 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === "history" && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="recent">Most Recent</option>
                <option value="score_high">Best Score</option>
                <option value="score_low">Worst Score</option>
                <option value="price_high">Highest Price</option>
                <option value="price_low">Lowest Price</option>
              </select>
            )}
            <button
              onClick={() => {
                if (activeTab === "prices") fetchPrices();
                else fetchHistory();
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {/* ─── Community Prices Tab ─── */}
        {!loading && activeTab === "prices" && (
          <>
            {prices.length === 0 ? (
              <EmptyState
                title="No community prices yet"
                description="Be the first to analyze a quote! Every analysis you run builds our community pricing database."
              />
            ) : (
              <div className="grid gap-4">
                {prices.map((price, i) => (
                  <div
                    key={i}
                    className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold capitalize">
                            {price.itemName}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                            {formatCategory(price.category)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {price.dataPoints} report{price.dataPoints !== 1 ? "s" : ""}
                          </span>
                          <span>
                            Range: ${price.minQuoted.toLocaleString()} – $
                            {price.maxQuoted.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">
                            Avg Quoted
                          </p>
                          <p className="text-xl font-bold text-white">
                            ${price.avgQuoted.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">
                            Fair Range
                          </p>
                          <p className="text-lg font-semibold text-emerald-400">
                            ${price.avgFairLow.toLocaleString()} – $
                            {price.avgFairHigh.toLocaleString()}
                          </p>
                        </div>
                        {price.avgQuoted > price.avgFairHigh ? (
                          <div className="flex items-center gap-1 text-orange-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {Math.round(
                                ((price.avgQuoted - price.avgFairHigh) /
                                  price.avgFairHigh) *
                                  100
                              )}
                              % over
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-medium">Fair</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price bar visualization */}
                    <div className="mt-4 relative h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-emerald-500/30 rounded-full"
                        style={{
                          left: `${Math.max(0, (price.avgFairLow / (price.maxQuoted * 1.2)) * 100)}%`,
                          width: `${((price.avgFairHigh - price.avgFairLow) / (price.maxQuoted * 1.2)) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute h-full w-1 bg-white rounded-full"
                        style={{
                          left: `${(price.avgQuoted / (price.maxQuoted * 1.2)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>${price.minQuoted}</span>
                      <span className="text-emerald-500">Fair range</span>
                      <span>${price.maxQuoted}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Recent Analyses Tab ─── */}
        {!loading && activeTab === "history" && (
          <>
            {history.length === 0 ? (
              <EmptyState
                title="No analyses yet"
                description="Start checking quotes to build your history. Every analysis is saved for quick future reference."
              />
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  {historyTotal} total{" "}
                  {historyTotal === 1 ? "analysis" : "analyses"}
                </p>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id}>
                      <button
                        onClick={() => loadFullAnalysis(item.id)}
                        className={`w-full text-left bg-gray-800/40 border rounded-xl p-5 transition-all hover:border-indigo-500/30 ${
                          expandedRow === item.id
                            ? "border-indigo-500/50"
                            : "border-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <span
                                className={`text-2xl font-bold ${scoreColor(
                                  item.overallScore
                                )}`}
                              >
                                {item.overallScore}/10
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${scoreBg(
                                  item.overallScore
                                )}`}
                              >
                                {verdictLabel(item.overallVerdict)}
                              </span>
                              {item.hasAiAnalysis && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  AI
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 truncate capitalize">
                              {item.topItem || "Service quote"} ·{" "}
                              {formatCategory(item.serviceCategory)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-semibold">
                              ${item.totalQuoted.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Fair: ${item.fairTotalLow.toLocaleString()} – $
                              {item.fairTotalHigh.toLocaleString()}
                            </p>
                          </div>
                          <div className="shrink-0 text-right hidden sm:block">
                            <p className="text-xs text-gray-500">
                              {item.regionLabel || `ZIP ${item.zipCode}`}
                            </p>
                            <p className="text-xs text-gray-600">
                              {timeAgo(item.createdAt)}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {expandedRow === item.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </div>
                        {item.potentialSavings > 0 && (
                          <div className="mt-2 text-xs text-orange-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Potential savings: $
                            {item.potentialSavings.toLocaleString()}
                          </div>
                        )}
                      </button>

                      {/* Expanded detail */}
                      {expandedRow === item.id && expandedAnalysis && (
                        <div className="mt-1 bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 space-y-4">
                          {(
                            expandedAnalysis as {
                              lineItems?: Array<{
                                item: string;
                                quotedPrice: number;
                                fairPriceLow: number;
                                fairPriceHigh: number;
                                status: string;
                                aiExplanation?: string;
                              }>;
                            }
                          ).lineItems?.map(
                            (
                              li: {
                                item: string;
                                quotedPrice: number;
                                fairPriceLow: number;
                                fairPriceHigh: number;
                                status: string;
                                aiExplanation?: string;
                              },
                              idx: number
                            ) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0"
                              >
                                <div>
                                  <p className="font-medium">{li.item}</p>
                                  {li.aiExplanation && (
                                    <p className="text-xs text-purple-300 mt-1 max-w-lg">
                                      {li.aiExplanation.slice(0, 150)}
                                      {li.aiExplanation.length > 150 && "..."}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    ${li.quotedPrice.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Fair: ${li.fairPriceLow} – ${li.fairPriceHigh}
                                  </p>
                                </div>
                                <span
                                  className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                                    li.status === "fair"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : li.status === "slightly_high"
                                      ? "bg-yellow-500/10 text-yellow-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {li.status === "fair"
                                    ? "Fair"
                                    : li.status === "slightly_high"
                                    ? "High"
                                    : "Overpriced"}
                                </span>
                              </div>
                            )
                          )}

                          {(expandedAnalysis as { aiAnalysis?: { detailedExplanation?: string } }).aiAnalysis
                            ?.detailedExplanation && (
                            <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                              <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4" /> AI Analysis
                              </h4>
                              <p className="text-sm text-gray-300 whitespace-pre-line">
                                {(
                                  expandedAnalysis as {
                                    aiAnalysis: {
                                      detailedExplanation: string;
                                    };
                                  }
                                ).aiAnalysis.detailedExplanation.slice(0, 500)}
                                ...
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── Category Stats Tab ─── */}
        {!loading && activeTab === "stats" && (
          <>
            {stats.length === 0 ? (
              <EmptyState
                title="No stats yet"
                description="Analyze some quotes to start building category statistics. The more quotes we analyze, the smarter we get."
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {stats.map((stat) => {
                  const overpricedPct =
                    stat.totalAnalyses > 0
                      ? Math.round(
                          (stat.overpricedCount / stat.totalAnalyses) * 100
                        )
                      : 0;
                  return (
                    <div
                      key={stat.category}
                      className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          {formatCategory(stat.category)}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {stat.totalAnalyses} quotes analyzed
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Avg Score
                          </p>
                          <p
                            className={`text-2xl font-bold ${scoreColor(
                              stat.avgScore
                            )}`}
                          >
                            {stat.avgScore}/10
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Avg Quote
                          </p>
                          <p className="text-2xl font-bold">
                            ${stat.avgQuoted.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Avg Savings Found
                          </p>
                          <p className="text-lg font-semibold text-emerald-400">
                            ${stat.avgSavings.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Overpriced Rate
                          </p>
                          <p
                            className={`text-lg font-semibold ${
                              overpricedPct > 50
                                ? "text-red-400"
                                : overpricedPct > 30
                                ? "text-yellow-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {overpricedPct}%
                          </p>
                        </div>
                      </div>

                      {/* Fair vs Overpriced bar */}
                      <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                          style={{
                            width: `${
                              stat.totalAnalyses > 0
                                ? (stat.fairCount / stat.totalAnalyses) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span className="text-emerald-500">
                          {stat.fairCount} fair
                        </span>
                        <span className="text-red-500">
                          {stat.overpricedCount} overpriced
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-gray-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ShieldCheck className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-400 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      <a
        href="/analyze"
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
      >
        <Eye className="w-4 h-4" />
        Analyze Your First Quote
      </a>
    </div>
  );
}
