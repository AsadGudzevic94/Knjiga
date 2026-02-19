import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyze Your Quote",
  description:
    "Paste any service quote and get instant AI-powered analysis. See if you're being overcharged with line-by-line price breakdowns for your zip code.",
  alternates: { canonical: "/analyze" },
  openGraph: {
    title: "Analyze Your Quote | QuoteCheck",
    description:
      "Paste any service quote and get instant AI-powered analysis. See if you're being overcharged.",
  },
};

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
