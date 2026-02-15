import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "QuoteCheck - Is This Price Fair?",
  description:
    "Instantly analyze any service quote to see if you're being overcharged. Car repairs, plumbing, dental work, home renovations and more. Save thousands with AI-powered price analysis.",
  keywords: [
    "price check",
    "quote analyzer",
    "fair price",
    "service quote",
    "overcharged",
    "car repair cost",
    "plumbing cost",
    "dental cost",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
