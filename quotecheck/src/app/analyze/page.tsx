"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReceiptScanner from "@/components/ReceiptScanner";
import type { QuoteAnalysis } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  TrendingDown,
  MessageSquareText,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Camera,
  Type,
  Sparkles,
  Globe,
  Eye,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Zap,
  Database,
  Shield,
  Calendar,
  HelpCircle,
  DollarSign,
  CircleAlert,
  Star,
  Search,
  Loader2 as Loader2Icon,
} from "lucide-react";

interface AnalysisResponse extends QuoteAnalysis {
  _cache?: { hit: boolean; type?: string; similarity?: number; ageHours?: number };
}

const CATEGORIES = [
  { value: "auto_repair", label: "Auto Repair" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "dental", label: "Dental" },
  { value: "medical", label: "Medical" },
  { value: "legal", label: "Legal Fees" },
  { value: "home_renovation", label: "Home Renovation" },
  { value: "roofing", label: "Roofing" },
  { value: "wedding", label: "Wedding Services" },
  { value: "moving", label: "Moving" },
  { value: "other", label: "Other" },
];

const EXAMPLE_QUOTE = `Auto Repair Estimate - Smith's Garage
Date: 02/14/2026

Brake pad replacement (front) - $380
Brake rotor resurfacing (front pair) - $250
Brake fluid flush - $120
Labor (2.5 hours @ $150/hr) - $375
Shop supplies & disposal fees - $45
Diagnostic fee - $95

Subtotal: $1,265
Tax: $101.20
Total: $1,366.20`;

export default function AnalyzePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [quoteText, setQuoteText] = useState("");
  const [category, setCategory] = useState("auto_repair");
  const [zipCode, setZipCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteText,
          serviceCategory: category,
          zipCode,
          businessName: businessName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadExample() {
    setQuoteText(EXAMPLE_QUOTE);
    setCategory("auto_repair");
    setZipCode("78701");
  }

  async function saveQuote() {
    if (!result || !user) return;

    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/quotes/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: CATEGORIES.find(c => c.value === category)?.label || category,
          vendor: businessName || 'Unknown Vendor',
          totalQuoted: result.totalQuoted,
          fairMid: result.fairMid,
          savings: result.savings,
          score: result.score,
          verdict: result.verdict,
          items: result.items,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('Failed to save quote');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setResult(null);
    setQuoteText("");
    setZipCode("");
    setBusinessName("");
    setError("");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {!result ? (
            <QuoteForm
              quoteText={quoteText}
              setQuoteText={setQuoteText}
              category={category}
              setCategory={setCategory}
              zipCode={zipCode}
              setZipCode={setZipCode}
              businessName={businessName}
              setBusinessName={setBusinessName}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              onLoadExample={loadExample}
            />
          ) : (
            <ResultsView
              result={result}
              onReset={resetForm}
              onSave={saveQuote}
              saving={saving}
              saved={saved}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function QuoteForm({
  quoteText,
  setQuoteText,
  category,
  setCategory,
  zipCode,
  setZipCode,
  businessName,
  setBusinessName,
  loading,
  error,
  onSubmit,
  onLoadExample,
}: {
  quoteText: string;
  setQuoteText: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  zipCode: string;
  setZipCode: (v: string) => void;
  businessName: string;
  setBusinessName: (v: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onLoadExample: () => void;
}) {
  const [inputMode, setInputMode] = useState<"type" | "scan">("type");

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Analyze Your Quote
        </h1>
        <p className="text-muted max-w-lg mx-auto">
          Paste your quote, type it in, or scan a photo of your receipt.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
      >
        {/* Input mode tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
          <button
            type="button"
            onClick={() => setInputMode("type")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
              inputMode === "type"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Type className="w-4 h-4" />
            Type / Paste
          </button>
          <button
            type="button"
            onClick={() => setInputMode("scan")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
              inputMode === "scan"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            Scan Receipt
          </button>
        </div>

        {inputMode === "scan" && (
          <div className="mb-5">
            <ReceiptScanner onTextExtracted={(text) => {
              setQuoteText(text);
              setInputMode("type");
            }} />
          </div>
        )}

        <div className={`mb-5 ${inputMode === "scan" && !quoteText ? "hidden" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              {inputMode === "scan" && quoteText ? "Extracted Text (edit if needed)" : "Your Quote / Estimate"}
            </label>
            <button
              type="button"
              onClick={onLoadExample}
              className="text-xs text-primary hover:underline"
            >
              Load example quote
            </button>
          </div>
          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder={`Paste your quote here...\n\nExample:\nBrake pad replacement - $380\nRotor resurfacing - $250\nLabor (2.5 hrs) - $375\nTotal: $1,005`}
            rows={10}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Service Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Zip Code
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) =>
                setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="e.g. 90210"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
              maxLength={5}
              pattern="\d{5}"
            />
          </div>
        </div>

        {/* Business Name (optional — enables reputation check) */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Business / Contractor Name{" "}
            <span className="text-xs text-muted font-normal">(optional — enables reputation check)</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Smith's Plumbing, Joe's Auto Shop"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
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
          className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing your quote...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Check This Quote
            </>
          )}
        </button>

        <p className="text-xs text-muted text-center mt-3">
          Your quote data is analyzed securely and never shared.
        </p>
      </form>
    </div>
  );
}

function ResultsView({
  result,
  onReset,
  onSave,
  saving,
  saved,
}: {
  result: AnalysisResponse;
  onReset: () => void;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
}) {
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const scoreColor =
    result.overallScore >= 7
      ? "text-green-500"
      : result.overallScore >= 4
      ? "text-yellow-500"
      : "text-red-500";

  const scoreBg =
    result.overallScore >= 7
      ? "bg-green-50 border-green-200"
      : result.overallScore >= 4
      ? "bg-yellow-50 border-yellow-200"
      : "bg-red-50 border-red-200";

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (result.overallScore / 10) * circumference;

  const strokeColor =
    result.overallScore >= 7
      ? "#22c55e"
      : result.overallScore >= 4
      ? "#eab308"
      : "#ef4444";

  function copyScript() {
    navigator.clipboard.writeText(result.negotiationScript);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Quote Analysis Results
        </h1>
        <div className="flex items-center gap-3">
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving || saved}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-primary text-white hover:bg-primary/90"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saved ? "✓ Saved" : saving ? "Saving..." : "Save Quote"}
            </button>
          )}
          <button
            onClick={onReset}
            className="text-sm text-primary hover:underline"
          >
            Analyze another quote
          </button>
        </div>
      </div>

      {/* Success message */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-green-700 font-medium">
            Quote saved successfully! View it in your{" "}
            <a href="/dashboard" className="underline hover:text-green-800">
              dashboard
            </a>
            .
          </span>
        </div>
      )}

      {/* Cache indicator */}
      {result._cache?.hit && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span className="text-indigo-700 font-medium">Instant result</span>
          <span className="text-indigo-500">
            {result._cache.type === "exact"
              ? "Matched from our database"
              : `Similar analysis found (${Math.round((result._cache.similarity || 0) * 100)}% match)`}
            {result._cache.ageHours !== undefined &&
              ` · analyzed ${result._cache.ageHours < 24 ? `${result._cache.ageHours}h` : `${Math.round(result._cache.ageHours / 24)}d`} ago`}
          </span>
          <Database className="w-3.5 h-3.5 text-indigo-400 ml-auto" />
        </div>
      )}

      {/* Score Card */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 ${scoreBg}`}
      >
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ animation: "score-fill 1s ease-out forwards" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>
              {result.overallScore}
            </span>
            <span className="text-xs text-muted">/10</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            {result.overallVerdict === "great_deal" && "Great Deal!"}
            {result.overallVerdict === "fair" && "Fair Price"}
            {result.overallVerdict === "slightly_high" && "Slightly Overpriced"}
            {result.overallVerdict === "overpriced" && "Overpriced"}
            {result.overallVerdict === "ripoff" && "Significantly Overpriced"}
          </h2>
          <p className="text-sm text-muted mb-3">{result.summary}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted">Quoted: </span>
              <span className="font-semibold">
                ${result.totalQuoted.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted">Fair range: </span>
              <span className="font-semibold text-green-600">
                ${result.fairTotalLow.toLocaleString()} - $
                {result.fairTotalHigh.toLocaleString()}
              </span>
            </div>
            {result.potentialSavings > 0 && (
              <div>
                <span className="text-muted">Potential savings: </span>
                <span className="font-bold text-accent">
                  ${result.potentialSavings.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {result.redFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            Red Flags Detected
          </h3>
          <ul className="space-y-2">
            {result.redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Deep Analysis */}
      {result.aiAnalysis?.poweredByAi && (
        <>
          {/* Detailed Explanation */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Deep Analysis
                <span className="text-xs font-normal text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full ml-1">
                  Powered by Claude
                </span>
              </h3>
            </div>
            <div className="p-5">
              <div className="prose prose-sm max-w-none text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                {result.aiAnalysis.detailedExplanation}
              </div>
            </div>
          </div>

          {/* Score Justification + Regional Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                <Eye className="w-4 h-4 text-primary" />
                Why This Score?
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {result.aiAnalysis.scoreJustification}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Your Area
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {result.aiAnalysis.regionalContext}
              </p>
            </div>
          </div>

          {/* Community Insights */}
          {result.aiAnalysis.communityInsights.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  What People Are Saying Online
                </h3>
                <p className="text-xs text-muted mt-1">
                  Community insights from Reddit, forums, and consumer sites
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {result.aiAnalysis.communityInsights.map((insight, i) => (
                  <div key={i} className="p-4 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {insight.sentiment === "price_too_high" ? (
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                      ) : insight.sentiment === "supports_price" ? (
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary mb-0.5">
                        {insight.source}
                      </p>
                      <p className="text-sm text-muted leading-relaxed">
                        &ldquo;{insight.snippet}&rdquo;
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        insight.sentiment === "price_too_high"
                          ? "bg-red-50 text-red-600"
                          : insight.sentiment === "supports_price"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {insight.sentiment === "price_too_high"
                        ? "Price is high"
                        : insight.sentiment === "supports_price"
                        ? "Supports price"
                        : "Neutral"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watch Out For */}
          {result.aiAnalysis.watchOutFor.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5" />
                Things to Watch Out For
              </h3>
              <ul className="space-y-2">
                {result.aiAnalysis.watchOutFor.map((item, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Line Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" />
            Line-by-Line Analysis
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {result.lineItems.map((item, i) => (
            <div key={i} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      item.status === "fair"
                        ? "bg-green-400"
                        : item.status === "slightly_high"
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="font-medium text-sm text-foreground">
                    {item.item}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    item.status === "fair"
                      ? "bg-green-100 text-green-700"
                      : item.status === "slightly_high"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.status === "fair"
                    ? "Fair"
                    : item.status === "slightly_high"
                    ? `+${item.percentageOver}% High`
                    : `+${item.percentageOver}% Overpriced`}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted ml-5">
                <span>
                  Quoted:{" "}
                  <span className="font-semibold text-foreground">
                    ${item.quotedPrice.toLocaleString()}
                  </span>
                </span>
                <span>
                  Fair range:{" "}
                  <span className="font-semibold text-green-600">
                    ${item.fairPriceLow.toLocaleString()} - $
                    {item.fairPriceHigh.toLocaleString()}
                  </span>
                </span>
              </div>
              <p className="text-xs text-muted mt-1.5 ml-5">{item.notes}</p>
              {item.aiExplanation && (
                <div className="mt-2 ml-5 bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs text-purple-800 leading-relaxed flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-400" />
                    {item.aiExplanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Protection Section ── */}
      {result.protection && (
        <>
          {/* Scam Alerts */}
          {result.protection.scamFlags.length > 0 && (
            <div
              className={`rounded-2xl border p-5 ${
                result.protection.riskLevel === "high"
                  ? "bg-red-50 border-red-200"
                  : result.protection.riskLevel === "medium"
                  ? "bg-orange-50 border-orange-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <h3
                className={`font-semibold flex items-center gap-2 mb-4 ${
                  result.protection.riskLevel === "high"
                    ? "text-red-700"
                    : result.protection.riskLevel === "medium"
                    ? "text-orange-700"
                    : "text-yellow-700"
                }`}
              >
                <Shield className="w-5 h-5" />
                Scam Pattern Alerts
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                    result.protection.riskLevel === "high"
                      ? "bg-red-100 text-red-700"
                      : result.protection.riskLevel === "medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {result.protection.riskLevel === "high"
                    ? "HIGH RISK"
                    : result.protection.riskLevel === "medium"
                    ? "MEDIUM RISK"
                    : "LOW RISK"}
                </span>
              </h3>
              <div className="space-y-4">
                {result.protection.scamFlags.map((flag, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      flag.severity === "critical"
                        ? "bg-red-100/50 border-red-200"
                        : flag.severity === "warning"
                        ? "bg-orange-100/50 border-orange-200"
                        : "bg-yellow-100/50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <CircleAlert
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          flag.severity === "critical"
                            ? "text-red-500"
                            : flag.severity === "warning"
                            ? "text-orange-500"
                            : "text-yellow-500"
                        }`}
                      />
                      <div>
                        <span className="font-semibold text-sm text-foreground">
                          {flag.name}
                        </span>
                        <span className="text-xs text-muted ml-2">
                          {flag.matchedOn}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted ml-7 mb-2">
                      {flag.description}
                    </p>
                    <div className="ml-7 p-2.5 bg-white/60 rounded-lg border border-white">
                      <p className="text-xs font-semibold text-foreground mb-0.5">
                        What to do:
                      </p>
                      <p className="text-xs text-muted">{flag.whatToDo}</p>
                    </div>
                    {flag.realExample && (
                      <p className="text-xs text-muted ml-7 mt-2 italic">
                        Real case: {flag.realExample}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden Fees */}
          {result.protection.hiddenFees.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  Hidden Fees to Watch For
                </h3>
                <p className="text-xs text-muted mt-1">
                  Common fees that may not be in your quote but could appear on the final bill
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {result.protection.hiddenFees.map((fee, i) => (
                  <div key={i} className="p-4 flex items-start gap-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                        fee.likelihood === "very_likely"
                          ? "bg-red-100 text-red-600"
                          : fee.likelihood === "likely"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {fee.likelihood === "very_likely"
                        ? "Very Likely"
                        : fee.likelihood === "likely"
                        ? "Likely"
                        : "Possible"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {fee.fee}
                        </span>
                        <span className="text-sm font-semibold text-amber-600">
                          {fee.typicalRange}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {fee.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seasonal Tip + Smart Questions side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seasonal Price Intelligence */}
            {result.protection.seasonalTip && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Best Time to Buy
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      BEST
                    </span>
                    <span className="text-sm text-foreground">
                      {result.protection.seasonalTip.bestMonths}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      WORST
                    </span>
                    <span className="text-sm text-foreground">
                      {result.protection.seasonalTip.worstMonths}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                      SAVE
                    </span>
                    <span className="text-sm text-foreground">
                      {result.protection.seasonalTip.savingsPercent}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {result.protection.seasonalTip.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Reputation Lookup CTA */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                <Star className="w-4 h-4 text-indigo-600" />
                Check This Business
              </h3>
              <p className="text-xs text-muted mb-3">
                Want to know if this contractor is trustworthy? Our AI agent
                will search reviews, BBB complaints, and license records.
              </p>
              <a
                href="/reputation"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition"
              >
                <Search className="w-3.5 h-3.5" />
                Look Up Reputation
              </a>
            </div>
          </div>

          {/* Smart Questions — Ask Before You Sign */}
          {result.protection.smartQuestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                  Ask Before You Sign
                  <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {result.protection.smartQuestions.length} questions
                  </span>
                </h3>
                {showQuestions ? (
                  <ChevronUp className="w-5 h-5 text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted" />
                )}
              </button>

              {showQuestions && (
                <div className="px-5 pb-5">
                  <p className="text-xs text-muted mb-3">
                    These questions are specifically chosen for{" "}
                    {result.serviceCategory.toLowerCase()} services. Ask them
                    before committing.
                  </p>
                  <div className="grid gap-2">
                    {result.protection.smartQuestions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <span className="text-xs font-bold text-primary bg-blue-50 w-6 h-6 flex items-center justify-center rounded-full shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-foreground">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Negotiation Tips */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <MessageSquareText className="w-5 h-5 text-primary" />
          Negotiation Tips
        </h3>
        <ul className="space-y-2">
          {result.negotiationTips.map((tip, i) => (
            <li key={i} className="text-sm text-muted flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Negotiation Script */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowScript(!showScript)}
          className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary" />
            Ready-to-Use Negotiation Script
          </h3>
          {showScript ? (
            <ChevronUp className="w-5 h-5 text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted" />
          )}
        </button>

        {showScript && (
          <div className="px-5 pb-5">
            <div className="bg-blue-50 rounded-xl p-4 relative">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {result.negotiationScript}
              </pre>
              <button
                onClick={copyScript}
                className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition"
                title="Copy to clipboard"
              >
                {scriptCopied ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Copy className="w-4 h-4 text-muted" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              Use this script when calling or visiting the service provider. Adjust the tone to match your style.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-center">
        <h3 className="text-white font-bold text-lg mb-2">
          Want Unlimited Quote Checks?
        </h3>
        <p className="text-blue-100 text-sm mb-4">
          Upgrade to Pro for unlimited analyses, detailed reports, and custom
          negotiation scripts.
        </p>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-2 bg-white text-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition"
        >
          View Pro Plans
        </Link>
      </div>
    </div>
  );
}
