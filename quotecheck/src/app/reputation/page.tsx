"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Star,
  Shield,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Loader2,
  ArrowLeft,
  BadgeCheck,
  XCircle,
  Info,
  Users,
  BarChart3,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

interface ContractorReport {
  found: boolean;
  name: string;
  report?: {
    totalAnalyses: number;
    avgScore: number;
    avgQuoted: number;
    avgSavings: number;
    overpricedPct: number;
    categories: string[];
  };
  recentAnalyses?: {
    id: number;
    date: string;
    category: string;
    score: number;
    totalQuoted: number;
    fairRange: string;
    savings: number;
    verdict: string;
  }[];
}

interface ReviewSource {
  platform: string;
  rating: string;
  reviewCount: string;
  url?: string;
  snippet: string;
}

interface ReputationResult {
  businessName: string;
  overallRating: "excellent" | "good" | "mixed" | "poor" | "unknown";
  ratingScore: number;
  summary: string;
  reviewSources: ReviewSource[];
  complaints: string[];
  positives: string[];
  licenseInfo: string;
  yearsInBusiness: string;
  warningFlags: string[];
  recommendation: string;
}

const CATEGORIES = [
  { value: "auto_repair", label: "Auto Repair" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "dental", label: "Dental" },
  { value: "medical", label: "Medical" },
  { value: "legal", label: "Legal" },
  { value: "home_renovation", label: "Home Renovation" },
  { value: "roofing", label: "Roofing" },
  { value: "wedding", label: "Wedding" },
  { value: "moving", label: "Moving" },
  { value: "other", label: "Other" },
];

function ratingColor(rating: string): string {
  switch (rating) {
    case "excellent": return "text-emerald-500";
    case "good": return "text-green-500";
    case "mixed": return "text-yellow-500";
    case "poor": return "text-red-500";
    default: return "text-gray-400";
  }
}

function ratingBg(rating: string): string {
  switch (rating) {
    case "excellent": return "bg-emerald-50 border-emerald-200";
    case "good": return "bg-green-50 border-green-200";
    case "mixed": return "bg-yellow-50 border-yellow-200";
    case "poor": return "bg-red-50 border-red-200";
    default: return "bg-gray-50 border-gray-200";
  }
}

function ratingLabel(rating: string): string {
  return rating.charAt(0).toUpperCase() + rating.slice(1);
}

export default function ReputationPage() {
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReputationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "community">("ai");
  const [communityData, setCommunityData] = useState<ContractorReport | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    setCommunityData(null);

    // Fetch both AI reputation and community data in parallel
    const aiPromise = fetch("/api/reputation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, location, category }),
    });

    const communityPromise = fetch(
      `/api/contractor-report?name=${encodeURIComponent(businessName)}${
        location ? `&zip=${encodeURIComponent(location)}` : ""
      }`
    );

    try {
      const [aiRes, commRes] = await Promise.all([aiPromise, communityPromise]);

      const aiData = await aiRes.json();
      if (aiRes.ok) {
        setResult(aiData);
      } else {
        setError(aiData.error || "Something went wrong.");
      }

      const commData = await commRes.json();
      if (commRes.ok) {
        setCommunityData(commData);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCommunityOnly() {
    if (!businessName.trim()) return;
    setCommunityLoading(true);
    try {
      const res = await fetch(
        `/api/contractor-report?name=${encodeURIComponent(businessName)}${
          location ? `&zip=${encodeURIComponent(location)}` : ""
        }`
      );
      const data = await res.json();
      if (res.ok) setCommunityData(data);
    } catch {
      // ignore
    } finally {
      setCommunityLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to quote analyzer
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              AI-Powered Reputation Check
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Should You Trust This Business?
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Our AI agent searches reviews, BBB complaints, license records,
              and lawsuit history across the web to give you the full picture.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8"
          >
            <div className="mb-5">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Business / Contractor Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Smith's Plumbing, Joe's Auto Repair, Dr. Johnson Dental"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Location (City, State)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Service Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Researching (this may take 15-30 seconds)...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Look Up Reputation
                </>
              )}
            </button>
          </form>

          {/* Tab Switcher */}
          {(result || communityData) && (
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === "ai"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Shield className="w-4 h-4" />
                AI Reputation
              </button>
              <button
                onClick={() => {
                  setActiveTab("community");
                  if (!communityData && businessName) fetchCommunityOnly();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === "community"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Users className="w-4 h-4" />
                Community Data
                {communityData?.found && communityData.report && (
                  <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                    {communityData.report.totalAnalyses}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Community Data Tab */}
          {activeTab === "community" && (result || communityData) && (
            <div className="animate-fade-in space-y-6 mb-8">
              {communityLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-3 text-sm text-muted">Loading community data...</span>
                </div>
              ) : !communityData?.found ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    No community data yet
                  </h3>
                  <p className="text-sm text-muted">
                    No quotes from &ldquo;{communityData?.name || businessName}&rdquo; have been analyzed by our community yet.
                    Be the first to{" "}
                    <Link href="/analyze" className="text-primary hover:underline">
                      analyze a quote
                    </Link>{" "}
                    from this contractor.
                  </p>
                </div>
              ) : communityData.report && (
                <>
                  {/* Report Card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Community Report Card: {communityData.name}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-foreground">
                          {communityData.report.totalAnalyses}
                        </p>
                        <p className="text-xs text-muted">Quotes Analyzed</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className={`text-2xl font-bold ${
                          communityData.report.avgScore >= 7
                            ? "text-green-500"
                            : communityData.report.avgScore >= 4
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}>
                          {communityData.report.avgScore}/10
                        </p>
                        <p className="text-xs text-muted">Avg Score</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-foreground">
                          ${communityData.report.avgQuoted.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">Avg Quote</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className={`text-2xl font-bold ${
                          communityData.report.overpricedPct > 50
                            ? "text-red-500"
                            : communityData.report.overpricedPct > 25
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}>
                          {communityData.report.overpricedPct}%
                        </p>
                        <p className="text-xs text-muted">Overpriced Rate</p>
                      </div>
                    </div>

                    {communityData.report.avgSavings > 0 && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-green-600 shrink-0" />
                        <p className="text-sm text-green-700">
                          On average, users could save <strong>${communityData.report.avgSavings.toLocaleString()}</strong> by negotiating with this contractor.
                        </p>
                      </div>
                    )}

                    {communityData.report.categories.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted mb-2">Services analyzed:</p>
                        <div className="flex flex-wrap gap-2">
                          {communityData.report.categories.map((cat) => (
                            <span
                              key={cat}
                              className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full"
                            >
                              {cat.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Analyses */}
                  {communityData.recentAnalyses && communityData.recentAnalyses.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-gray-100">
                        <h3 className="font-semibold text-foreground">
                          Recent Quotes Analyzed
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {communityData.recentAnalyses.map((a) => (
                          <div key={a.id} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {a.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </p>
                              <p className="text-xs text-muted">
                                {new Date(a.date).toLocaleDateString()} &middot; {a.fairRange}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                                  a.score >= 7
                                    ? "bg-green-500"
                                    : a.score >= 4
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              >
                                {a.score}
                              </span>
                              <p className="text-xs text-muted mt-1">
                                ${a.totalQuoted.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Results */}
          {activeTab === "ai" && result && (
            <div className="animate-fade-in space-y-6">
              {/* Overall Rating */}
              <div className={`rounded-2xl border p-6 ${ratingBg(result.overallRating)}`}>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="45" fill="none"
                        stroke={
                          result.ratingScore >= 8 ? "#10b981" :
                          result.ratingScore >= 6 ? "#22c55e" :
                          result.ratingScore >= 4 ? "#eab308" : "#ef4444"
                        }
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 - (result.ratingScore / 10) * 2 * Math.PI * 45}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${ratingColor(result.overallRating)}`}>
                        {result.ratingScore}/10
                      </span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {result.businessName}
                    </h2>
                    <span className={`text-lg font-semibold ${ratingColor(result.overallRating)}`}>
                      {ratingLabel(result.overallRating)} Reputation
                    </span>
                    <p className="text-sm text-muted mt-2">{result.summary}</p>
                    {result.yearsInBusiness && (
                      <p className="text-xs text-muted mt-1">In business: {result.yearsInBusiness}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning Flags */}
              {result.warningFlags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5" />
                    Warning Flags
                  </h3>
                  <ul className="space-y-2">
                    {result.warningFlags.map((flag, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Review Sources */}
              {result.reviewSources.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Review Sources
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {result.reviewSources.map((src, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-foreground">
                            {src.platform}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-amber-600">
                              {src.rating}
                            </span>
                            <span className="text-xs text-muted">
                              ({src.reviewCount})
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted mb-1">{src.snippet}</p>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View reviews <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.positives.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      Positives
                    </h3>
                    <ul className="space-y-2">
                      {result.positives.map((p, i) => (
                        <li key={i} className="text-sm text-muted flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.complaints.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      Complaints
                    </h3>
                    <ul className="space-y-2">
                      {result.complaints.map((c, i) => (
                        <li key={i} className="text-sm text-muted flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* License Info */}
              {result.licenseInfo && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                    License & Certification
                  </h3>
                  <p className="text-sm text-muted">{result.licenseInfo}</p>
                </div>
              )}

              {/* Recommendation */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-primary" />
                  Our Recommendation
                </h3>
                <p className="text-sm text-muted leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
