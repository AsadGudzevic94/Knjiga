import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "QuoteCheck terms of service. Read our terms before using the service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-muted mb-8">
              Last updated: February 19, 2026
            </p>

            <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using QuoteCheck (&quot;the Service&quot;),
                  operated by QuoteCheck (&quot;we,&quot; &quot;us,&quot;
                  &quot;our&quot;), you agree to be bound by these Terms of
                  Service. If you do not agree, do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  2. Description of Service
                </h2>
                <p>
                  QuoteCheck provides AI-powered analysis of service quotes to
                  help consumers determine if they are being charged a fair
                  price. The Service includes:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Quote analysis with fairness scoring</li>
                  <li>Line-by-line price comparisons</li>
                  <li>Negotiation tips and scripts</li>
                  <li>Community price data and trends</li>
                  <li>Business reputation lookup</li>
                  <li>Quote comparison tools</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  3. Important Disclaimer
                </h2>
                <p>
                  QuoteCheck provides <strong>estimates and guidance only</strong>.
                  Our price analysis is based on available data, regional
                  averages, and AI analysis. Actual fair market prices may vary
                  based on specific circumstances, quality of materials, urgency,
                  complexity, and other factors.{" "}
                  <strong>
                    QuoteCheck is not a substitute for professional advice.
                  </strong>{" "}
                  Always use your own judgment when making purchasing decisions.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  4. User Accounts
                </h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    You must provide accurate information when creating an
                    account.
                  </li>
                  <li>
                    You are responsible for maintaining the security of your
                    account credentials.
                  </li>
                  <li>One account per person. Sharing accounts is prohibited.</li>
                  <li>
                    You must be at least 18 years old to use the Service.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  5. Subscriptions and Billing
                </h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    QuoteCheck offers paid subscription plans billed monthly or
                    annually through Lemon Squeezy.
                  </li>
                  <li>
                    Prices are listed in US dollars and may change with
                    reasonable notice.
                  </li>
                  <li>
                    Subscriptions auto-renew unless cancelled before the renewal
                    date.
                  </li>
                  <li>
                    You can cancel your subscription at any time from your
                    account Settings. Access continues until the end of the
                    current billing period.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  6. Refund Policy
                </h2>
                <p>
                  We offer a <strong>30-day money-back guarantee</strong> for
                  new subscribers. If you are not satisfied within the first 30
                  days, contact us for a full refund. After 30 days, refunds are
                  provided at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  7. Acceptable Use
                </h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Use the Service for any unlawful purpose or to facilitate
                    fraud
                  </li>
                  <li>
                    Submit false, misleading, or fabricated quotes for analysis
                  </li>
                  <li>
                    Attempt to reverse-engineer, scrape, or extract our pricing
                    data or algorithms
                  </li>
                  <li>
                    Use automated tools (bots, scrapers) to access the Service
                    beyond normal use
                  </li>
                  <li>
                    Share your account or resell access to the Service
                  </li>
                  <li>
                    Interfere with the operation or security of the Service
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  8. Intellectual Property
                </h2>
                <p>
                  All content, features, and functionality of QuoteCheck
                  (including text, graphics, logos, and software) are owned by us
                  and protected by intellectual property laws. Your quote data
                  remains yours; by submitting it, you grant us a license to
                  analyze it and use anonymized, aggregated data to improve our
                  service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  9. Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by law, QuoteCheck shall not
                  be liable for any indirect, incidental, special, consequential,
                  or punitive damages, including loss of profits, data, or
                  business opportunities. Our total liability for any claim
                  arising from the Service shall not exceed the amount you paid
                  us in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  10. Service Availability
                </h2>
                <p>
                  We strive to maintain the Service but do not guarantee
                  uninterrupted access. We may modify, suspend, or discontinue
                  features with reasonable notice. Scheduled maintenance will be
                  communicated in advance when possible.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  11. Account Termination
                </h2>
                <p>
                  We may suspend or terminate your account if you violate these
                  terms. You may delete your account at any time from your
                  Settings page.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  12. Dispute Resolution
                </h2>
                <p>
                  Any disputes arising from the use of QuoteCheck will be
                  resolved through binding arbitration in accordance with the
                  rules of the American Arbitration Association. You agree to
                  resolve disputes individually and waive any right to class
                  action proceedings.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  13. Governing Law
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance
                  with the laws of the United States and the state in which
                  QuoteCheck operates, without regard to conflict of law
                  provisions.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  14. Changes to Terms
                </h2>
                <p>
                  We may update these Terms from time to time. Material changes
                  will be communicated via email or in-app notice. Continued use
                  of the Service after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  15. Contact Us
                </h2>
                <p>
                  For questions about these Terms, contact us at{" "}
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
