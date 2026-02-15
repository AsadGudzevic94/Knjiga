"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
} from "lucide-react";

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
  const [quotes, setQuotes] = useState<SavedQuote[]>(DEMO_QUOTES);

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

  function removeQuote(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
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

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
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
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
