import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Quotes Side-by-Side",
  description:
    "Got multiple quotes for the same job? Compare them side-by-side and instantly see which is the best deal with AI-powered analysis.",
  openGraph: {
    title: "Compare Quotes Side-by-Side | QuoteCheck",
    description:
      "Compare multiple service quotes side-by-side and instantly see which is the best deal.",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
