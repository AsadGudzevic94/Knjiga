"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ArrowRight, Zap, X, ShieldCheck } from "lucide-react";

const PLANS = [
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    price: 20,
    period: "/mo",
    description: "For anyone who hates overpaying",
    features: [
      "500 quote checks per month",
      "Detailed line-item analysis",
      "Custom negotiation scripts",
      "Quote history & savings tracker",
      "Priority analysis speed",
      "Email & PDF reports",
      "Price trend data",
      "24/7 support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "pro_annual",
    name: "Pro Annual",
    price: 10,
    period: "/mo",
    description: "Best value - save 50%",
    annualPrice: 120,
    features: [
      "Everything in Pro Monthly",
      "Save 50% vs monthly",
      "Billed annually at $120",
      "Priority support",
      "Early access to new features",
      "Exclusive price database access",
    ],
    cta: "Get Started",
    popular: true,
  },
];

const FAQ = [
  {
    q: "How accurate is the price analysis?",
    a: "QuoteCheck uses regional pricing data, industry benchmarks, and AI analysis to determine fair market rates. Our estimates are typically within 10-15% of actual market averages. We continuously improve accuracy as more users contribute data.",
  },
  {
    q: "What types of quotes can I analyze?",
    a: "You can analyze virtually any service quote including auto repair, plumbing, electrical, HVAC, dental, medical, legal fees, home renovation, roofing, wedding services, moving, and more.",
  },
  {
    q: "Is my quote data private?",
    a: "Absolutely. Your quote data is encrypted and never shared with third parties. We use anonymized, aggregated data to improve our pricing models, but your personal information and specific quotes remain completely private.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Yes! You can cancel anytime from your account settings. Your Pro access continues until the end of your billing period. No cancellation fees, no hassle.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 30 days, we'll give you a full refund. No questions asked.",
  },
];

export default function PricingPage() {
  const [billingModal, setBillingModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              No free trials. No games. Just honest pricing.
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Simple, Honest Pricing
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto mb-6">
              One quote check can save you hundreds. The Pro plan pays for
              itself with a single use.
            </p>

            {/* Why No Free Tier */}
            <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6 text-left">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                Why we don't offer a free tier
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                In today's era of AI bots and automation, bad actors can easily create thousands of fake accounts
                to abuse free tiers. This drives up costs and forces honest businesses to either raise prices for
                paying customers or compromise on service quality. We believe in honest pricing: you pay a fair
                price, we deliver premium AI-powered analysis without artificial restrictions or degraded service.
                Every subscription helps us maintain quality and keep the service sustainable for everyone.
              </p>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 relative flex flex-col ${
                  plan.popular
                    ? "border-2 border-primary shadow-lg shadow-blue-100 bg-white"
                    : "border border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted mb-5">{plan.description}</p>
                  <p className="text-4xl font-bold mb-1">
                    ${plan.price}
                    <span className="text-base font-normal text-muted">
                      {plan.period}
                    </span>
                  </p>
                  <div className="h-6 mb-5">
                    {plan.annualPrice && (
                      <p className="text-xs text-muted">
                        Billed as ${plan.annualPrice}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setBillingModal(plan.id)}
                  className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "border-2 border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {billingModal && (
        <CheckoutModal
          planId={billingModal}
          onClose={() => setBillingModal(null)}
        />
      )}

      <Footer />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <span className="font-medium text-sm text-foreground">{question}</span>
        <span className="text-muted ml-4">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}

function CheckoutModal({
  planId,
  onClose,
}: {
  planId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = PLANS.find((p) => p.id === planId);

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in - redirect to login
          window.location.href = "/login?redirect=/pricing";
          return;
        }
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Lemon Squeezy checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-1">Ready to subscribe?</h3>
        <p className="text-sm text-muted mb-6">
          {plan?.name} - ${plan?.price}/mo. Cancel anytime.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>500 quote checks per month</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>AI-powered analysis with web search</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>30-day money-back guarantee</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              Continue to Checkout
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-xs text-muted text-center mt-4">
          Secure payment powered by Lemon Squeezy
        </p>
      </div>
    </div>
  );
}
