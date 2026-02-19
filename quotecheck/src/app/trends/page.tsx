"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Loader2,
  BarChart3,
  Trash2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendMonth {
  month: string;
  avgQuoted: number;
  avgFairMid: number;
  analysisCount: number;
  avgScore: number;
}

interface TrendSummary {
  category: string;
  currentAvg: number;
  currentFairMid: number;
  pctChange: number;
  totalAnalyses: number;
  avgScore: number;
  months: TrendMonth[];
}

interface PriceAlert {
  id: string;
  service_category: string;
  zip_code: string;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
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

function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
];

export default function TrendsPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [zip, setZip] = useState("");
  const [trends, setTrends] = useState<TrendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertCategory, setAlertCategory] = useState("auto_repair");
  const [alertZip, setAlertZip] = useState("");
  const [alertError, setAlertError] = useState("");

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (zip && zip.length >= 3) params.set("zip", zip.slice(0, 3));
      const res = await fetch(`/api/market-trends?${params.toString()}`);
      const data = await res.json();
      setTrends(data.trends || []);
    } catch {
      setTrends([]);
    } finally {
      setLoading(false);
    }
  }, [category, zip]);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setAlertsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const res = await fetch("/api/price-alerts", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  async function createAlert() {
    setAlertError("");
    if (!alertZip || !/^\d{5}$/.test(alertZip)) {
      setAlertError("Enter a valid 5-digit zip code.");
      return;
    }
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const res = await fetch("/api/price-alerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({
        serviceCategory: alertCategory,
        zipCode: alertZip,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setAlertError(data.error || "Failed to create alert.");
      return;
    }

    setShowAlertForm(false);
    setAlertZip("");
    fetchAlerts();
  }

  async function deleteAlert(id: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    await fetch(`/api/price-alerts?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.session.access_token}` },
    });
    fetchAlerts();
  }

  // Build chart data from all trends
  const chartData = (() => {
    const monthMap: Record<string, Record<string, number>> = {};
    for (const t of trends) {
      for (const m of t.months) {
        if (!monthMap[m.month]) monthMap[m.month] = {};
        monthMap[m.month][t.category] = m.avgQuoted;
      }
    }
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cats]) => ({
        month: month.slice(5), // "MM" from "YYYY-MM"
        ...cats,
      }));
  })();

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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <BarChart3 className="w-4 h-4" />
              Community Price Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Market Price Trends
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              See how service prices are moving based on real quotes analyzed by
              our community. Set alerts to know when prices change.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  Zip Code Area (first 3 digits)
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) =>
                    setZip(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  placeholder="e.g. 902 or 90210"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          {/* Price Trend Chart */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted">
                Loading trends...
              </span>
            </div>
          ) : trends.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No trend data yet
              </h3>
              <p className="text-sm text-muted">
                As more quotes are analyzed by the community, price trends will
                appear here. Be the first to{" "}
                <Link href="/analyze" className="text-primary hover:underline">
                  analyze a quote
                </Link>
                !
              </p>
            </div>
          ) : (
            <>
              {/* Chart */}
              {chartData.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Average Quoted Prices Over Time
                  </h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="#9ca3af"
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value).toLocaleString()}`,
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Legend />
                        {trends.map((t, i) => (
                          <Line
                            key={t.category}
                            type="monotone"
                            dataKey={t.category}
                            name={categoryLabel(t.category)}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {trends.map((t) => (
                  <div
                    key={t.category}
                    className="bg-white rounded-2xl border border-gray-100 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground text-sm">
                        {categoryLabel(t.category)}
                      </h3>
                      <span className="text-xs text-muted bg-gray-50 px-2 py-1 rounded-full">
                        {t.totalAnalyses} quotes
                      </span>
                    </div>
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-2xl font-bold text-foreground">
                        ${t.currentAvg.toLocaleString()}
                      </span>
                      {t.pctChange !== 0 && (
                        <span
                          className={`flex items-center gap-0.5 text-sm font-semibold ${
                            t.pctChange > 0 ? "text-red-500" : "text-green-500"
                          }`}
                        >
                          {t.pctChange > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(t.pctChange)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      Fair market: ${t.currentFairMid.toLocaleString()} &middot;
                      Avg score: {t.avgScore}/10
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Price Alerts Section */}
          {user && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  My Price Alerts
                </h2>
                <button
                  onClick={() => setShowAlertForm(!showAlertForm)}
                  className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  New Alert
                </button>
              </div>

              {showAlertForm && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <select
                      value={alertCategory}
                      onChange={(e) => setAlertCategory(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {CATEGORIES.filter((c) => c.value).map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={alertZip}
                      onChange={(e) =>
                        setAlertZip(e.target.value.replace(/\D/g, "").slice(0, 5))
                      }
                      placeholder="Zip code"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      maxLength={5}
                    />
                    <button
                      onClick={createAlert}
                      className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark transition"
                    >
                      Create Alert
                    </button>
                  </div>
                  {alertError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {alertError}
                    </p>
                  )}
                </div>
              )}

              {alertsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-6">
                  <BellOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted">
                    No price alerts yet. Create one to get notified when prices
                    change in your area.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {categoryLabel(alert.service_category)}
                        </span>
                        <span className="text-xs text-muted ml-2">
                          Zip: {alert.zip_code}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-1.5 text-muted hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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
