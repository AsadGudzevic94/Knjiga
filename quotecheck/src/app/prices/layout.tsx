import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Prices",
  description:
    "Browse fair market prices for services in your area. See what others are paying for auto repair, plumbing, dental work, and more based on real quote data.",
  alternates: { canonical: "/prices" },
  openGraph: {
    title: "Community Prices | QuoteCheck",
    description:
      "Browse fair market prices for services in your area based on real quote data.",
  },
};

export default function PricesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
