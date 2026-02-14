"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReceiptScanner from "@/components/ReceiptScanner";
import type { QuoteAnalysis } from "@/lib/types";
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
} from "lucide-react";

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
  const [quoteText, setQuoteText] = useState("");
  const [category, setCategory] = useState("auto_repair");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteAnalysis | null>(null);

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

  function resetForm() {
    setResult(null);
    setQuoteText("");
    setZipCode("");
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
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              onLoadExample={loadExample}
            />
          ) : (
            <ResultsView result={result} onReset={resetForm} />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
}: {
  result: QuoteAnalysis;
  onReset: () => void;
}) {
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

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
        <button
          onClick={onReset}
          className="text-sm text-primary hover:underline"
        >
          Analyze another quote
        </button>
      </div>

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
            </div>
          ))}
        </div>
      </div>

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
