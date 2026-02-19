import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Reputation Check",
  description:
    "Look up any contractor or business reputation. Our AI searches reviews, BBB complaints, license records, and community data to give you the full picture.",
  openGraph: {
    title: "Business Reputation Check | QuoteCheck",
    description:
      "Look up any contractor or business reputation with AI-powered research.",
  },
};

export default function ReputationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
