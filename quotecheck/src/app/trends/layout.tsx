import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Price Trends",
  description:
    "See how service prices are trending in your area. Track price movements for auto repair, plumbing, HVAC, dental, and more based on real community data.",
  openGraph: {
    title: "Market Price Trends | QuoteCheck",
    description:
      "See how service prices are trending in your area based on real community data.",
  },
};

export default function TrendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
