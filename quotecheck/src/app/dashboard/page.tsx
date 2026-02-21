"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  TrendingDown,
  ShieldCheck,
  FileText,
  ArrowRight,
  Trash2,
  DollarSign,
  Target,
  Activity,
  Mail,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RefreshCw,
  Pencil,
  Sparkles,
  AlertTriangle,
  Eye,
} from "lucide-react";
import type { QuoteAnalysis } from "@/lib/types";

interface EmailAnalysis {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  received_at: string;
  analysis_status: "pending" | "processing" | "completed" | "failed" | "skipped";
  detected_category: string | null;
  detected_vendor: string | null;
  analysis_result: QuoteAnalysis | null;
  draft_reply: string | null;
  error_message: string | null;
}

interface SavedQuote {
  id: string;
  date: string;
  category: string;
  vendor: string;
  totalQuoted: number;
  fairMid: number;
  savings: number;
  score: number;
  verdict: string;
  itemCount: number;
  quoteData: QuoteAnalysis | null;
}

const SCORE_COLORS: Record<string, string> = {
  great_deal: "#22c55e",
  fair: "#22c55e",
  slightly_high: "#eab308",
  overpriced: "#ef4444",
  ripoff: "#ef4444",
};

const VERDICT_LABELS: Record<string, string> = {
  great_deal: "Great Deal",
  fair: "Fair Price",
  slightly_high: "Slightly High",
  overpriced: "Overpriced",
  ripoff: "Rip-off",
};

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"];

function stripCitations(text: string): string {
  if (!text) return "";
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "");
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"quotes" | "emails">("quotes");
  const [emailAnalyses, setEmailAnalyses] = useState<EmailAnalysis[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [generatingReply, setGeneratingReply] = useState<string | null>(null);
  const [copiedReply, setCopiedReply] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editedReplyText, setEditedReplyText] = useState<string>("");
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{
    quotesUsed: number;
    quotesLimit: number;
    quotesRemaining: number;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    async function fetchQuotes() {
      if (!user) return;

      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          router.replace('/login');
          return;
        }

        const response = await fetch('/api/quotes/list', {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuotes(data.quotes || []);
        } else {
          setQuotes([]);
        }

        const quotaResponse = await fetch('/api/usage/check', {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
          },
        });

        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();
          setQuotaInfo({
            quotesUsed: quotaData.quotesUsed,
            quotesLimit: quotaData.quotesLimit,
            quotesRemaining: quotaData.quotesRemaining
          });
        }
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchQuotes();
      // Google Ads conversion tracking — fire on dashboard load (signup completion)
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag('event', 'ads_conversion_PURCHASE_1', {});
      }
    }
  }, [user, authLoading, router]);

  // Check URL for tab param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "emails") {
      setActiveTab("emails");
    }
  }, []);

  // Fetch email analyses when tab switches
  useEffect(() => {
    if (activeTab === "emails" && user && emailAnalyses.length === 0) {
      fetchEmailAnalyses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  async function fetchEmailAnalyses() {
    setEmailsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch("/api/email/analyses", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEmailAnalyses(data.analyses || []);
      }
    } catch (err) {
      console.error("Failed to fetch email analyses:", err);
    } finally {
      setEmailsLoading(false);
    }
  }

  async function generateReply(emailId: string) {
    setGeneratingReply(emailId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch("/api/email/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({ emailAnalysisId: emailId }),
      });

      if (res.ok) {
        const data = await res.json();
        setEmailAnalyses((prev) =>
          prev.map((ea) =>
            ea.id === emailId ? { ...ea, draft_reply: data.reply } : ea
          )
        );
      }
    } catch (err) {
      console.error("Failed to generate reply:", err);
    } finally {
      setGeneratingReply(null);
    }
  }

  function copyReply(emailId: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedReply(emailId);
    setTimeout(() => setCopiedReply(null), 2000);
  }

  async function deleteEmailAnalysis(emailId: string) {
    setDeletingEmail(emailId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch(`/api/email/analyses?id=${emailId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (res.ok) {
        setEmailAnalyses((prev) => prev.filter((ea) => ea.id !== emailId));
        if (expandedEmail === emailId) setExpandedEmail(null);
      }
    } catch (err) {
      console.error("Failed to delete email analysis:", err);
    } finally {
      setDeletingEmail(null);
    }
  }

  function startEditReply(emailId: string, currentText: string) {
    setEditingReply(emailId);
    setEditedReplyText(currentText);
  }

  function saveEditedReply(emailId: string) {
    setEmailAnalyses((prev) =>
      prev.map((ea) =>
        ea.id === emailId ? { ...ea, draft_reply: editedReplyText } : ea
      )
    );
    setEditingReply(null);
  }

  const stats = useMemo(() => {
    const totalSaved = quotes.reduce((s, q) => s + q.savings, 0);
    const avgScore = quotes.length
      ? Math.round((quotes.reduce((s, q) => s + q.score, 0) / quotes.length) * 10) / 10
      : 0;
    const totalChecked = quotes.length;
    const overpricedCount = quotes.filter(
      (q) => q.verdict === "overpriced" || q.verdict === "slightly_high" || q.verdict === "ripoff"
    ).length;
    const overpricedPct = totalChecked > 0 ? Math.round((overpricedCount / totalChecked) * 100) : 0;

    return { totalSaved, avgScore, totalChecked, overpricedPct };
  }, [quotes]);

  const savingsOverTime = useMemo(() => {
    const sorted = [...quotes].sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    return sorted.map((q) => {
      cumulative += q.savings;
      return {
        date: new Date(q.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        savings: q.savings,
        cumulative,
      };
    });
  }, [quotes]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; savings: number }> = {};
    for (const q of quotes) {
      if (!map[q.category]) map[q.category] = { count: 0, savings: 0 };
      map[q.category].count++;
      map[q.category].savings += q.savings;
    }
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.savings - a.savings);
  }, [quotes]);

  const verdictDistribution = useMemo(() => {
    let fair = 0, high = 0, overpriced = 0;
    for (const q of quotes) {
      if (q.verdict === "fair" || q.verdict === "great_deal") fair++;
      else if (q.verdict === "slightly_high") high++;
      else overpriced++;
    }
    return [
      { name: "Fair", value: fair },
      { name: "Slightly High", value: high },
      { name: "Overpriced", value: overpriced },
    ].filter((d) => d.value > 0);
  }, [quotes]);

  async function removeQuote(id: string) {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch(`/api/quotes/list?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (res.ok) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        if (expandedQuote === id) setExpandedQuote(null);
      }
    } catch (err) {
      console.error("Failed to delete quote:", err);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted text-sm">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted mt-0.5">
                Your quote analysis history and savings.
              </p>
            </div>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition shadow-sm"
            >
              New Quote Check
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quota Bar */}
          {quotaInfo && (
            <div className="mb-6 bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted">
                    Monthly Quota: {quotaInfo.quotesUsed} / {quotaInfo.quotesLimit}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {quotaInfo.quotesRemaining} left
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((quotaInfo.quotesUsed / quotaInfo.quotesLimit) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab("quotes")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "quotes"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              Quotes
              {quotes.length > 0 && (
                <span className="text-xs bg-gray-200 text-muted px-1.5 py-0.5 rounded-full">
                  {quotes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("emails")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "emails"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              Emails
            </button>
          </div>

          {/* ========== QUOTES TAB ========== */}
          {activeTab === "quotes" && (
            <>
              {quotes.length === 0 ? (
                /* Empty state */
                <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    No quotes saved yet
                  </h2>
                  <p className="text-muted text-sm max-w-md mx-auto mb-6">
                    Analyze a quote and save it to start tracking your savings over time.
                  </p>
                  <Link
                    href="/analyze"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition"
                  >
                    Analyze Your First Quote
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-foreground">${stats.totalSaved.toLocaleString()}</p>
                      <p className="text-xs text-muted">Total Saved</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-foreground">{stats.totalChecked}</p>
                      <p className="text-xs text-muted">Quotes Checked</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-yellow-500" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-foreground">{stats.avgScore}/10</p>
                      <p className="text-xs text-muted">Avg Score</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                          <Activity className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-foreground">{stats.overpricedPct}%</p>
                      <p className="text-xs text-muted">Found Overpriced</p>
                    </div>
                  </div>

                  {/* Quote Cards */}
                  <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide px-1">
                      Saved Quotes
                    </h3>
                    {quotes.map((q) => {
                      const isExpanded = expandedQuote === q.id;
                      const scoreColor =
                        q.score >= 7 ? "bg-green-500" : q.score >= 4 ? "bg-yellow-500" : "bg-red-500";
                      const scoreBorder =
                        q.score >= 7 ? "border-green-200" : q.score >= 4 ? "border-yellow-200" : "border-red-200";
                      const verdictBg =
                        q.verdict === "fair" || q.verdict === "great_deal"
                          ? "bg-green-50 text-green-700"
                          : q.verdict === "slightly_high"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700";

                      return (
                        <div
                          key={q.id}
                          className={`bg-white rounded-xl border transition-all ${
                            isExpanded ? `${scoreBorder} shadow-md` : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          {/* Card header — always visible */}
                          <button
                            onClick={() => setExpandedQuote(isExpanded ? null : q.id)}
                            className="w-full p-4 text-left"
                          >
                            <div className="flex items-center gap-4">
                              {/* Score badge */}
                              <div
                                className={`w-11 h-11 ${scoreColor} rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}
                              >
                                {q.score}
                              </div>

                              {/* Main info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-semibold text-foreground truncate">
                                    {q.vendor}
                                  </p>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${verdictBg}`}>
                                    {VERDICT_LABELS[q.verdict] || q.verdict}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted">
                                  <span>{q.category}</span>
                                  <span>•</span>
                                  <span>
                                    {new Date(q.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Price info */}
                              <div className="text-right shrink-0 hidden sm:block">
                                <p className="text-sm font-bold text-foreground">
                                  ${q.totalQuoted.toLocaleString()}
                                </p>
                                <p className="text-xs text-green-600 font-medium">
                                  Save ${q.savings.toLocaleString()}
                                </p>
                              </div>

                              {/* View Details button */}
                              <div
                                className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                                  isExpanded
                                    ? "bg-primary/10 text-primary"
                                    : "bg-gray-50 text-muted hover:bg-gray-100 hover:text-foreground"
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{isExpanded ? "Hide" : "Details"}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>

                            {/* Mobile price row */}
                            <div className="flex items-center justify-between mt-2 sm:hidden">
                              <span className="text-sm font-bold text-foreground">
                                ${q.totalQuoted.toLocaleString()}
                              </span>
                              <span className="text-sm text-green-600 font-medium">
                                Save ${q.savings.toLocaleString()}
                              </span>
                            </div>
                          </button>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 px-4 pb-4">
                              {/* Price breakdown bar */}
                              <div className="pt-4 pb-3">
                                <div className="flex items-center justify-between text-xs text-muted mb-2">
                                  <span>Fair Price: ${q.fairMid.toLocaleString()}</span>
                                  <span>Quoted: ${q.totalQuoted.toLocaleString()}</span>
                                </div>
                                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-green-400 rounded-full"
                                    style={{ width: `${Math.min((q.fairMid / q.totalQuoted) * 100, 100)}%` }}
                                  />
                                  <div
                                    className="absolute inset-y-0 left-0 bg-red-400 rounded-full opacity-40"
                                    style={{ width: "100%" }}
                                  />
                                  <div
                                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                                    style={{ width: `${Math.min((q.fairMid / q.totalQuoted) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Line items from quoteData (handles both old "items" and new "lineItems" format) */}
                              {(() => {
                                const items = q.quoteData?.lineItems || (q.quoteData as any)?.items;
                                if (!items || items.length === 0) return null;
                                return (
                                <div className="mb-4">
                                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                                    Line Items
                                  </p>
                                  <div className="space-y-1.5">
                                    {items.map((li: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                                          li.status === "overpriced"
                                            ? "bg-red-50"
                                            : li.status === "slightly_high"
                                            ? "bg-yellow-50"
                                            : "bg-green-50"
                                        }`}
                                      >
                                        <span className="text-foreground">{li.item}</span>
                                        <div className="flex items-center gap-3">
                                          <span className="font-medium">${li.quotedPrice.toLocaleString()}</span>
                                          <span className="text-xs text-muted">
                                            Fair: ${li.fairPriceLow.toLocaleString()}-${li.fairPriceHigh.toLocaleString()}
                                          </span>
                                          <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                              li.status === "overpriced"
                                                ? "bg-red-100 text-red-700"
                                                : li.status === "slightly_high"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-green-100 text-green-700"
                                            }`}
                                          >
                                            {li.status === "fair" ? "Fair" : li.status === "slightly_high" ? "High" : "Overpriced"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                );
                              })()}

                              {/* AI Analysis snippet */}
                              {q.quoteData?.aiAnalysis?.detailedExplanation && (
                                <div className="mb-4 bg-purple-50 border border-purple-100 rounded-xl p-4">
                                  <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5 mb-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    AI Analysis
                                  </p>
                                  <p className="text-sm text-purple-800 leading-relaxed line-clamp-4">
                                    {stripCitations(q.quoteData.aiAnalysis.detailedExplanation)}
                                  </p>
                                </div>
                              )}

                              {/* Negotiation tips */}
                              {q.quoteData?.negotiationTips && q.quoteData.negotiationTips.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                                    Negotiation Tips
                                  </p>
                                  <ul className="space-y-1">
                                    {q.quoteData.negotiationTips.slice(0, 3).map((tip, i) => (
                                      <li key={i} className="text-sm text-muted flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        {stripCitations(tip)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Red flags */}
                              {q.quoteData?.protection?.scamFlags && q.quoteData.protection.scamFlags.length > 0 && (
                                <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-4">
                                  <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Flags Found
                                  </p>
                                  <ul className="space-y-1">
                                    {q.quoteData.protection.scamFlags.map((flag, i) => (
                                      <li key={i} className="text-sm text-red-700">
                                        <span className="font-medium">{flag.name}</span>
                                        <span className="text-red-600"> — {stripCitations(flag.description)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Watch out for */}
                              {q.quoteData?.aiAnalysis?.watchOutFor && q.quoteData.aiAnalysis.watchOutFor.length > 0 && (
                                <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-1.5">
                                    <Eye className="w-3.5 h-3.5" />
                                    Watch Out For
                                  </p>
                                  <ul className="space-y-1">
                                    {q.quoteData.aiAnalysis.watchOutFor.map((item, i) => (
                                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                        {stripCitations(item)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Delete this saved quote?")) {
                                      removeQuote(q.id);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Charts — only show when 3+ quotes */}
                  {quotes.length >= 3 && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        {/* Savings over time */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
                          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
                            <TrendingDown className="w-4 h-4 text-primary" />
                            Savings Over Time
                          </h3>
                          <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={savingsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                  formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
                                  labelStyle={{ fontWeight: 600 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="cumulative"
                                  stroke="#2563eb"
                                  strokeWidth={2}
                                  dot={{ fill: "#2563eb", r: 3 }}
                                  name="Total Saved"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Verdict pie */}
                        <div className="bg-white rounded-xl border border-gray-100 p-5">
                          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            Quote Verdicts
                          </h3>
                          <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={verdictDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={4}
                                  dataKey="value"
                                  label={({ name, value }) => `${name}: ${value}`}
                                >
                                  {verdictDistribution.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Savings by category */}
                      {categoryBreakdown.length > 1 && (
                        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
                          <h3 className="font-semibold text-foreground mb-4 text-sm">
                            Savings by Category
                          </h3>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={categoryBreakdown} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Savings"]} />
                                <Bar dataKey="savings" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={20} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ========== EMAILS TAB ========== */}
          {activeTab === "emails" && (
            <div className="space-y-4">
              {emailsLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted mt-2">Loading email analyses...</p>
                </div>
              ) : emailAnalyses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    No email analyses yet
                  </h2>
                  <p className="text-muted text-sm max-w-md mx-auto mb-6">
                    Set up email automation to forward quotes and get instant AI analysis.
                  </p>
                  <Link
                    href="/settings/automation"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition"
                  >
                    Set Up Email Automation
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Email Analyses</h3>
                    <button
                      onClick={fetchEmailAnalyses}
                      className="text-xs text-primary hover:text-primary-dark transition"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {emailAnalyses.map((ea) => (
                      <div key={ea.id}>
                        <button
                          onClick={() =>
                            setExpandedEmail(
                              expandedEmail === ea.id ? null : ea.id
                            )
                          }
                          className="w-full px-5 py-4 hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  ea.analysis_status === "completed"
                                    ? "bg-green-500"
                                    : ea.analysis_status === "processing"
                                    ? "bg-yellow-500 animate-pulse"
                                    : ea.analysis_status === "skipped"
                                    ? "bg-gray-400"
                                    : ea.analysis_status === "failed"
                                    ? "bg-red-500"
                                    : "bg-gray-300"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {ea.from_name || ea.from_email}
                                </p>
                                <p className="text-xs text-muted truncate">
                                  {ea.subject}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                              {ea.analysis_result && (
                                <div className="text-right hidden sm:block">
                                  <span
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                                    style={{
                                      backgroundColor:
                                        SCORE_COLORS[
                                          ea.analysis_result
                                            .overallVerdict as keyof typeof SCORE_COLORS
                                        ] || "#6b7280",
                                    }}
                                  >
                                    {ea.analysis_result.overallScore}
                                  </span>
                                </div>
                              )}
                              {ea.detected_category && (
                                <span className="text-xs text-muted hidden sm:block">
                                  {ea.detected_category.replace(/_/g, " ")}
                                </span>
                              )}
                              <span className="text-xs text-muted">
                                {new Date(ea.received_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                              {expandedEmail === ea.id ? (
                                <ChevronUp className="w-4 h-4 text-muted" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Expanded view */}
                        {expandedEmail === ea.id && (
                          <div className="px-5 pb-5 border-t border-gray-50">
                            {ea.analysis_status === "completed" &&
                            ea.analysis_result ? (
                              <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-muted">Score</p>
                                    <p className="text-lg font-bold">
                                      {ea.analysis_result.overallScore}/10
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-muted">Quoted</p>
                                    <p className="text-lg font-bold">
                                      ${ea.analysis_result.totalQuoted.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-muted">Fair Range</p>
                                    <p className="text-lg font-bold">
                                      ${ea.analysis_result.fairTotalLow.toLocaleString()}-${ea.analysis_result.fairTotalHigh.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-muted">Potential Savings</p>
                                    <p className="text-lg font-bold text-green-600">
                                      ${ea.analysis_result.potentialSavings.toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {ea.analysis_result.lineItems.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-foreground mb-2">Line Items</p>
                                    <div className="space-y-1">
                                      {ea.analysis_result.lineItems.map((li, idx) => (
                                        <div
                                          key={idx}
                                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                                            li.status === "overpriced"
                                              ? "bg-red-50"
                                              : li.status === "slightly_high"
                                              ? "bg-yellow-50"
                                              : "bg-green-50"
                                          }`}
                                        >
                                          <span className="text-foreground">{li.item}</span>
                                          <div className="flex items-center gap-3">
                                            <span className="font-medium">${li.quotedPrice.toLocaleString()}</span>
                                            <span
                                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                li.status === "overpriced"
                                                  ? "bg-red-100 text-red-700"
                                                  : li.status === "slightly_high"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-green-100 text-green-700"
                                              }`}
                                            >
                                              {li.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Draft reply section */}
                                <div className="border-t border-gray-100 pt-4">
                                  {ea.draft_reply ? (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                          <MessageSquare className="w-4 h-4 text-primary" />
                                          Draft Reply
                                        </p>
                                        <div className="flex items-center gap-2">
                                          {editingReply === ea.id ? (
                                            <button
                                              onClick={() => saveEditedReply(ea.id)}
                                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition font-medium"
                                            >
                                              <Check className="w-3 h-3" /> Save
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => startEditReply(ea.id, ea.draft_reply!)}
                                              className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition"
                                            >
                                              <Pencil className="w-3 h-3" /> Edit
                                            </button>
                                          )}
                                          <button
                                            onClick={() => copyReply(ea.id, ea.draft_reply!)}
                                            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition"
                                          >
                                            {copiedReply === ea.id ? (
                                              <><Check className="w-3 h-3" /> Copied</>
                                            ) : (
                                              <><Copy className="w-3 h-3" /> Copy</>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => generateReply(ea.id)}
                                            disabled={generatingReply === ea.id}
                                            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition disabled:opacity-60"
                                          >
                                            {generatingReply === ea.id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <RefreshCw className="w-3 h-3" />
                                            )}
                                            Regenerate
                                          </button>
                                        </div>
                                      </div>
                                      {editingReply === ea.id ? (
                                        <textarea
                                          value={editedReplyText}
                                          onChange={(e) => setEditedReplyText(e.target.value)}
                                          rows={8}
                                          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                        />
                                      ) : (
                                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-muted whitespace-pre-wrap">
                                          {ea.draft_reply}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => generateReply(ea.id)}
                                      disabled={generatingReply === ea.id}
                                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition disabled:opacity-60"
                                    >
                                      {generatingReply === ea.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <MessageSquare className="w-4 h-4" />
                                      )}
                                      {generatingReply === ea.id ? "Generating reply..." : "Generate Reply"}
                                    </button>
                                  )}
                                </div>

                                <div className="border-t border-gray-100 pt-3 flex justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Delete this email analysis?")) {
                                        deleteEmailAnalysis(ea.id);
                                      }
                                    }}
                                    disabled={deletingEmail === ea.id}
                                    className="flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition disabled:opacity-60"
                                  >
                                    {deletingEmail === ea.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : ea.analysis_status === "skipped" ? (
                              <div className="pt-4 space-y-3">
                                <p className="text-sm text-muted">Skipped: {ea.error_message || "Not a quote email"}</p>
                                <div className="flex justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Delete this email analysis?")) deleteEmailAnalysis(ea.id);
                                    }}
                                    disabled={deletingEmail === ea.id}
                                    className="flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition disabled:opacity-60"
                                  >
                                    {deletingEmail === ea.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : ea.analysis_status === "failed" ? (
                              <div className="pt-4 space-y-3">
                                <p className="text-sm text-red-600">Failed: {ea.error_message || "Analysis error"}</p>
                                <div className="flex justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Delete this email analysis?")) deleteEmailAnalysis(ea.id);
                                    }}
                                    disabled={deletingEmail === ea.id}
                                    className="flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition disabled:opacity-60"
                                  >
                                    {deletingEmail === ea.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : ea.analysis_status === "processing" ? (
                              <div className="flex items-center gap-2 pt-4">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <p className="text-sm text-muted">Analysis in progress...</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted pt-4">Pending analysis</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
