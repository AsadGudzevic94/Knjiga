"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { QuoteAnalysis } from "@/lib/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  Trophy,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface QuoteSlot {
  id: number;
  vendorName: string;
  quoteText: string;
  category: string;
  zipCode: string;
  result: QuoteAnalysis | null;
  loading: boolean;
  error: string;
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

let nextId = 3;

export default function ComparePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/compare");
    }
  }, [user, authLoading, router]);

  const [slots, setSlots] = useState<QuoteSlot[]>([
    createSlot(1, "Quote A"),
    createSlot(2, "Quote B"),
  ]);
  const [sharedCategory, setSharedCategory] = useState("auto_repair");
  const [sharedZip, setSharedZip] = useState("");

  function createSlot(id: number, name: string): QuoteSlot {
    return {
      id,
      vendorName: name,
      quoteText: "",
      category: "",
      zipCode: "",
      result: null,
      loading: false,
      error: "",
    };
  }

  function addSlot() {
    if (slots.length >= 4) return;
    setSlots([...slots, createSlot(nextId++, `Quote ${String.fromCharCode(64 + slots.length + 1)}`)]);
  }

  function removeSlot(id: number) {
    if (slots.length <= 2) return;
    setSlots(slots.filter((s) => s.id !== id));
  }

  function updateSlot(id: number, updates: Partial<QuoteSlot>) {
    setSlots(slots.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  async function analyzeAll() {
    if (!sharedZip || !/^\d{5}$/.test(sharedZip)) {
      alert("Please enter a valid 5-digit zip code.");
      return;
    }

    const newSlots = slots.map((s) => ({
      ...s,
      loading: true,
      error: "",
      result: null,
    }));
    setSlots(newSlots);

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      router.replace("/login?redirect=/compare");
      return;
    }
    const token = session.session.access_token;

    const results = await Promise.all(
      newSlots.map(async (slot) => {
        if (!slot.quoteText.trim()) {
          return { ...slot, loading: false, error: "Please enter a quote." };
        }
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              quoteText: slot.quoteText,
              serviceCategory: sharedCategory,
              zipCode: sharedZip,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { ...slot, loading: false, error: data.error };
          }
          return { ...slot, loading: false, result: data };
        } catch {
          return { ...slot, loading: false, error: "Analysis failed." };
        }
      })
    );

    setSlots(results);
  }

  const allAnalyzed = slots.every((s) => s.result !== null);
  const bestSlot = allAnalyzed
    ? slots.reduce((best, s) =>
        s.result && (!best.result || s.result.overallScore > best.result.overallScore)
          ? s
          : best
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Compare Quotes Side-by-Side
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Got multiple quotes for the same job? Paste them in and we&apos;ll tell
              you which one is the best deal.
            </p>
          </div>

          {/* Shared settings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Service Category (same for all)
                </label>
                <select
                  value={sharedCategory}
                  onChange={(e) => setSharedCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
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
                  value={sharedZip}
                  onChange={(e) =>
                    setSharedZip(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  placeholder="e.g. 90210"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          {/* Quote slots */}
          <div className={`grid grid-cols-1 ${slots.length === 2 ? "md:grid-cols-2" : slots.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"} gap-4 mb-6`}>
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`bg-white rounded-2xl border p-5 ${
                  bestSlot?.id === slot.id && allAnalyzed
                    ? "border-green-400 ring-2 ring-green-100"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <input
                    value={slot.vendorName}
                    onChange={(e) =>
                      updateSlot(slot.id, { vendorName: e.target.value })
                    }
                    className="font-semibold text-foreground text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none w-full mr-2"
                    placeholder="Vendor name"
                  />
                  {bestSlot?.id === slot.id && allAnalyzed && (
                    <Trophy className="w-5 h-5 text-green-500 shrink-0" />
                  )}
                  {slots.length > 2 && (
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className="p-1 text-muted hover:text-red-500 transition shrink-0 ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <textarea
                  value={slot.quoteText}
                  onChange={(e) =>
                    updateSlot(slot.id, { quoteText: e.target.value })
                  }
                  placeholder={`Paste ${slot.vendorName}'s quote...\n\nExample:\nBrake pads - $380\nLabor - $250\nTotal: $630`}
                  rows={8}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-mono"
                />

                {slot.loading && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </div>
                )}

                {slot.error && (
                  <div className="mt-3 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {slot.error}
                  </div>
                )}

                {slot.result && (
                  <CompareResult
                    result={slot.result}
                    isBest={bestSlot?.id === slot.id}
                  />
                )}
              </div>
            ))}

            {slots.length < 4 && (
              <button
                onClick={addSlot}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-muted hover:border-primary hover:text-primary transition min-h-[200px]"
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">Add Quote</span>
              </button>
            )}
          </div>

          <button
            onClick={analyzeAll}
            disabled={slots.some((s) => s.loading)}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {slots.some((s) => s.loading) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Comparing quotes...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Compare All Quotes
              </>
            )}
          </button>

          {allAnalyzed && bestSlot?.result && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">
                Best Deal: {bestSlot.vendorName}
              </h3>
              <p className="text-sm text-muted mb-3">
                Score: {bestSlot.result.overallScore}/10 &middot; Total: $
                {bestSlot.result.totalQuoted.toLocaleString()} &middot; Fair
                range: ${bestSlot.result.fairTotalLow.toLocaleString()} - $
                {bestSlot.result.fairTotalHigh.toLocaleString()}
              </p>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                Get full analysis of this quote
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CompareResult({
  result,
  isBest,
}: {
  result: QuoteAnalysis;
  isBest: boolean;
}) {
  const scoreColor =
    result.overallScore >= 7
      ? "bg-green-500"
      : result.overallScore >= 4
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${scoreColor}`}
        >
          {result.overallScore}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            ${result.totalQuoted.toLocaleString()}
          </p>
          <p className="text-xs text-green-600">
            Fair: ${result.fairTotalLow.toLocaleString()} - $
            {result.fairTotalHigh.toLocaleString()}
          </p>
        </div>
      </div>

      {result.potentialSavings > 0 && (
        <p className="text-xs text-accent font-semibold">
          Potential savings: ${result.potentialSavings.toLocaleString()}
        </p>
      )}

      <div className="space-y-1">
        {result.lineItems.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                item.status === "fair"
                  ? "bg-green-400"
                  : item.status === "slightly_high"
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
            />
            <span className="text-muted truncate">{item.item}</span>
          </div>
        ))}
        {result.lineItems.length > 4 && (
          <p className="text-xs text-muted">
            +{result.lineItems.length - 4} more items
          </p>
        )}
      </div>

      {isBest && (
        <div className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg text-center">
          BEST DEAL
        </div>
      )}
    </div>
  );
}
