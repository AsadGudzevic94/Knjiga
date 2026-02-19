import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.quotecheck.chat"),
  title: {
    default: "QuoteCheck - Is This Price Fair?",
    template: "%s | QuoteCheck",
  },
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
    "home renovation cost",
    "negotiate price",
    "is this price fair",
  ],
  openGraph: {
    title: "QuoteCheck - Is This Price Fair?",
    description:
      "Paste any service quote and our AI tells you if you're being overcharged. Line-by-line analysis, fair price ranges, and negotiation scripts.",
    url: "https://www.quotecheck.chat",
    siteName: "QuoteCheck",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuoteCheck - Is This Price Fair?",
    description:
      "Paste any service quote and our AI tells you if you're being overcharged. Save thousands with AI-powered price analysis.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.quotecheck.chat",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
