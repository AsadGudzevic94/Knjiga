import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "QuoteCheck privacy policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted mb-8">
              Last updated: February 19, 2026
            </p>

            <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  1. Information We Collect
                </h2>
                <p>
                  When you use QuoteCheck, we collect information you provide
                  directly:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Account information:</strong> Email address, name,
                    city, state, and zip code when you create an account.
                  </li>
                  <li>
                    <strong>Quote data:</strong> Service quotes and estimates you
                    submit for analysis, including text content, service
                    category, and zip code.
                  </li>
                  <li>
                    <strong>Payment information:</strong> Processed securely by
                    our payment provider, Lemon Squeezy. We do not store your
                    credit card details.
                  </li>
                  <li>
                    <strong>Usage data:</strong> How you interact with the
                    service, pages visited, features used, and analysis history.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  2. How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>To provide and improve our quote analysis service</li>
                  <li>To generate fair market price comparisons for your area</li>
                  <li>
                    To build anonymized, aggregated community pricing data that
                    helps all users get better price intelligence
                  </li>
                  <li>To process payments and manage your subscription</li>
                  <li>
                    To send service-related communications (account updates,
                    price alerts you set up)
                  </li>
                  <li>To detect and prevent fraud or abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  3. Third-Party Services
                </h2>
                <p>We use the following third-party services:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Supabase:</strong> Database hosting and
                    authentication (data stored in the US)
                  </li>
                  <li>
                    <strong>Anthropic (Claude AI):</strong> AI-powered quote
                    analysis. Quote text is sent to Anthropic for analysis but is
                    not used to train their models.
                  </li>
                  <li>
                    <strong>Lemon Squeezy:</strong> Payment processing. Subject
                    to their own privacy policy.
                  </li>
                  <li>
                    <strong>Vercel:</strong> Application hosting
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  4. Data Sharing
                </h2>
                <p>
                  We do <strong>not</strong> sell your personal information. We
                  share data only:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    With service providers listed above, as necessary to operate
                    the service
                  </li>
                  <li>
                    In anonymized, aggregated form for community pricing data
                    (your personal details are never included)
                  </li>
                  <li>
                    If required by law, court order, or government request
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  5. Data Security
                </h2>
                <p>
                  We implement industry-standard security measures including
                  encrypted connections (HTTPS), secure authentication tokens,
                  and access controls. However, no method of transmission over
                  the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  6. Your Rights
                </h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Access your personal data</li>
                  <li>
                    Request deletion of your account and associated data (via
                    Settings &gt; Danger Zone)
                  </li>
                  <li>Export your quote analysis history</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
                <p>
                  <strong>California residents (CCPA):</strong> You have
                  additional rights under the California Consumer Privacy Act,
                  including the right to know what personal information we
                  collect and the right to request deletion. We do not sell
                  personal information.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  7. Cookies
                </h2>
                <p>
                  We use essential cookies for authentication and session
                  management. We may use analytics cookies (Google Analytics) to
                  understand how users interact with our service. You can disable
                  cookies in your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  8. Data Retention
                </h2>
                <p>
                  We retain your account data for as long as your account is
                  active. Quote analysis data is retained to provide community
                  pricing intelligence. When you delete your account, your
                  personal data is removed, though anonymized aggregate data may
                  be retained.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  9. Changes to This Policy
                </h2>
                <p>
                  We may update this privacy policy from time to time. We will
                  notify users of material changes via email or in-app notice.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  10. Contact Us
                </h2>
                <p>
                  For privacy-related questions, contact us at{" "}
                  <a
                    href="mailto:support@quotecheck.chat"
                    className="text-primary hover:underline"
                  >
                    support@quotecheck.chat
                  </a>
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
              >
                Back to QuoteCheck
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
