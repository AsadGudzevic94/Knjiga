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
  ExternalLink,
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
}

// Demo data - in production this would come from Supabase
const DEMO_QUOTES: SavedQuote[] = [
  {
    id: "1",
    date: "2026-02-14",
    category: "Auto Repair",
    vendor: "Smith's Garage",
    totalQuoted: 1366,
    fairMid: 980,
    savings: 386,
    score: 5,
    verdict: "slightly_high",
    itemCount: 6,
  },
  {
    id: "2",
    date: "2026-02-10",
    category: "Plumbing",
    vendor: "Quick Plumb Pro",
    totalQuoted: 850,
    fairMid: 720,
    savings: 130,
    score: 7,
    verdict: "fair",
    itemCount: 3,
  },
  {
    id: "3",
    date: "2026-02-05",
    category: "Dental",
    vendor: "Bright Smiles Dental",
    totalQuoted: 2100,
    fairMid: 1350,
    savings: 750,
    score: 3,
    verdict: "overpriced",
    itemCount: 4,
  },
  {
    id: "4",
    date: "2026-01-28",
    category: "Home Renovation",
    vendor: "Elite Home Builders",
    totalQuoted: 18500,
    fairMid: 15200,
    savings: 3300,
    score: 4,
    verdict: "slightly_high",
    itemCount: 8,
  },
  {
    id: "5",
    date: "2026-01-20",
    category: "HVAC",
    vendor: "CoolAir Systems",
    totalQuoted: 5200,
    fairMid: 5100,
    savings: 100,
    score: 8,
    verdict: "fair",
    itemCount: 5,
  },
  {
    id: "6",
    date: "2026-01-15",
    category: "Electrical",
    vendor: "Spark Electric",
    totalQuoted: 1800,
    fairMid: 1400,
    savings: 400,
    score: 5,
    verdict: "slightly_high",
    itemCount: 4,
  },
  {
    id: "7",
    date: "2026-01-08",
    category: "Auto Repair",
    vendor: "Downtown Auto",
    totalQuoted: 720,
    fairMid: 690,
    savings: 30,
    score: 9,
    verdict: "great_deal",
    itemCount: 3,
  },
  {
    id: "8",
    date: "2025-12-20",
    category: "Legal",
    vendor: "Johnson & Partners",
    totalQuoted: 3500,
    fairMid: 2800,
    savings: 700,
    score: 4,
    verdict: "slightly_high",
    itemCount: 2,
  },
];

const SCORE_COLORS = {
  great_deal: "#22c55e",
  fair: "#22c55e",
  slightly_high: "#eab308",
  overpriced: "#ef4444",
  ripoff: "#ef4444",
};

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"quotes" | "emails">("quotes");
  const [emailAnalyses, setEmailAnalyses] = useState<EmailAnalysis[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
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
    // Redirect if not logged in
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    // Fetch user's quotes and quota
    async function fetchQuotes() {
      if (!user) return;

      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          router.replace('/login');
          return;
        }

        // Fetch quotes
        const response = await fetch('/api/quotes/list', {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuotes(data.quotes || []);
        } else {
          console.error('Failed to fetch quotes');
          // If no quotes yet, show empty state
          setQuotes([]);
        }

        // Fetch quota info
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
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-20">
              <p className="text-muted">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Your Dashboard
              </h1>
              <p className="text-sm text-muted mt-1">
                Track your quotes, savings, and patterns over time.
              </p>
            </div>
            <Link
              href="/analyze"
              className="hidden sm:inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
            >
              New Quote Check
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quota Display */}
          {quotaInfo && (
            <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Monthly Quota
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Resets on the 1st of each month
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    {quotaInfo.quotesRemaining}
                  </p>
                  <p className="text-xs text-muted">remaining</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(quotaInfo.quotesUsed / quotaInfo.quotesLimit) * 100}%`
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-muted whitespace-nowrap">
                  {quotaInfo.quotesUsed} / {quotaInfo.quotesLimit}
                </span>
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab("quotes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "quotes"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              Quote History
            </button>
            <button
              onClick={() => setActiveTab("emails")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "emails"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Analyses
            </button>
          </div>

          {/* Email Analyses Tab */}
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
                                {/* Score summary */}
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
                                      $
                                      {ea.analysis_result.totalQuoted.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-muted">
                                      Fair Range
                                    </p>
                                    <p className="text-lg font-bold">
                                      $
                                      {ea.analysis_result.fairTotalLow.toLocaleString()}
                                      -$
                                      {ea.analysis_result.fairTotalHigh.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-muted">
                                      Potential Savings
                                    </p>
                                    <p className="text-lg font-bold text-green-600">
                                      $
                                      {ea.analysis_result.potentialSavings.toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Line items */}
                                {ea.analysis_result.lineItems.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-foreground mb-2">
                                      Line Items
                                    </p>
                                    <div className="space-y-1">
                                      {ea.analysis_result.lineItems.map(
                                        (li, idx) => (
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
                                            <span className="text-foreground">
                                              {li.item}
                                            </span>
                                            <div className="flex items-center gap-3">
                                              <span className="font-medium">
                                                $
                                                {li.quotedPrice.toLocaleString()}
                                              </span>
                                              <span
                                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                  li.status === "overpriced"
                                                    ? "bg-red-100 text-red-700"
                                                    : li.status ===
                                                      "slightly_high"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-green-100 text-green-700"
                                                }`}
                                              >
                                                {li.status
                                                  .replace(/_/g, " ")
                                                  .replace(/\b\w/g, (c) =>
                                                    c.toUpperCase()
                                                  )}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      )}
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
                                            onClick={() =>
                                              copyReply(ea.id, ea.draft_reply!)
                                            }
                                            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition"
                                          >
                                            {copiedReply === ea.id ? (
                                              <>
                                                <Check className="w-3 h-3" /> Copied
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3" /> Copy
                                              </>
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
                                      {generatingReply === ea.id
                                        ? "Generating reply..."
                                        : "Generate Reply"}
                                    </button>
                                  )}
                                </div>

                                {/* Delete button */}
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
                                <p className="text-sm text-muted">
                                  Skipped: {ea.error_message || "Not a quote email"}
                                </p>
                                <div className="flex justify-end">
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
                            ) : ea.analysis_status === "failed" ? (
                              <div className="pt-4 space-y-3">
                                <p className="text-sm text-red-600">
                                  Failed: {ea.error_message || "Analysis error"}
                                </p>
                                <div className="flex justify-end">
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
                            ) : ea.analysis_status === "processing" ? (
                              <div className="flex items-center gap-2 pt-4">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <p className="text-sm text-muted">
                                  Analysis in progress...
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted pt-4">
                                Pending analysis
                              </p>
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

          {/* Quotes Tab Content */}
          {activeTab === "quotes" && quotes.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 mb-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                No quotes analyzed yet
              </h2>
              <p className="text-muted text-sm max-w-md mx-auto mb-6">
                Upload your first service quote and our AI will tell you if the price is fair,
                what you should be paying, and how to negotiate a better deal.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition"
                >
                  Analyze Your First Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {quotaInfo && !quotaInfo.quotesLimit && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 px-6 py-3 rounded-xl font-semibold hover:border-primary hover:text-primary transition"
                  >
                    View Plans
                  </Link>
                )}
              </div>

              {/* Quick tips */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">Step 1</p>
                  <p className="text-xs text-muted">Paste or type your quote details into the analyzer</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">Step 2</p>
                  <p className="text-xs text-muted">Our AI researches real-time pricing for your area</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">Step 3</p>
                  <p className="text-xs text-muted">Get a detailed report with fair prices and negotiation tips</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats cards */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ${quotes.length === 0 || activeTab !== 'quotes' ? 'hidden' : ''}`}>
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Total Saved"
              value={`$${stats.totalSaved.toLocaleString()}`}
              color="text-green-500"
              bg="bg-green-50"
            />
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              label="Quotes Checked"
              value={stats.totalChecked.toString()}
              color="text-primary"
              bg="bg-blue-50"
            />
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Avg Score"
              value={`${stats.avgScore}/10`}
              color="text-yellow-500"
              bg="bg-yellow-50"
            />
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="Found Overpriced"
              value={`${stats.overpricedPct}%`}
              color="text-red-500"
              bg="bg-red-50"
            />
          </div>

          {/* Charts row */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 ${quotes.length === 0 || activeTab !== 'quotes' ? 'hidden' : ''}`}>
            {/* Cumulative savings */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                Savings Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={savingsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ fill: "#2563eb", r: 4 }}
                      name="Total Saved"
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={{ fill: "#10b981", r: 3 }}
                      name="Per Quote"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Verdict pie */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Quote Verdicts
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={verdictDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
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
          <div className={`bg-white rounded-2xl border border-gray-100 p-5 mb-8 ${quotes.length === 0 || activeTab !== 'quotes' ? 'hidden' : ''}`}>
            <h3 className="font-semibold text-foreground mb-4">
              Savings by Category
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Savings"]} />
                  <Bar dataKey="savings" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quote history table */}
          <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${quotes.length === 0 || activeTab !== 'quotes' ? 'hidden' : ''}`}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-foreground">Quote History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-muted uppercase tracking-wide">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Quoted</th>
                    <th className="px-5 py-3">Fair Price</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Savings</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-muted whitespace-nowrap">
                        {new Date(q.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {q.vendor}
                      </td>
                      <td className="px-5 py-3 text-muted">{q.category}</td>
                      <td className="px-5 py-3 font-medium">
                        ${q.totalQuoted.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-green-600 font-medium">
                        ${q.fairMid.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor:
                              SCORE_COLORS[q.verdict as keyof typeof SCORE_COLORS] || "#6b7280",
                          }}
                        >
                          {q.score}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-accent font-bold">
                          ${q.savings.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 text-muted hover:text-primary transition"
                            title="View details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeQuote(q.id)}
                            className="p-1.5 text-muted hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center ${color} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}
