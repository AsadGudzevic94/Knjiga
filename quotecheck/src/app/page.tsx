import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Search,
  FileText,
  TrendingDown,
  MessageSquareText,
  Car,
  Wrench,
  Stethoscope,
  Scale,
  Home,
  PartyPopper,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react";

const CATEGORIES = [
  { icon: Car, label: "Auto Repair", example: "$2,300 brake job? Check it." },
  { icon: Wrench, label: "Plumbing & HVAC", example: "$800 water heater install? Check it." },
  { icon: Stethoscope, label: "Medical & Dental", example: "$1,500 crown? Check it." },
  { icon: Home, label: "Home Renovation", example: "$15K kitchen remodel? Check it." },
  { icon: Scale, label: "Legal Fees", example: "$350/hr attorney? Check it." },
  { icon: PartyPopper, label: "Wedding Vendors", example: "$5K photographer? Check it." },
];

const STEPS = [
  {
    icon: FileText,
    title: "Paste Your Quote",
    description: "Copy and paste any service quote, estimate, or bill. Or just type in the details.",
  },
  {
    icon: Search,
    title: "AI Analyzes It",
    description: "Our AI compares every line item against fair market prices for your zip code.",
  },
  {
    icon: TrendingDown,
    title: "See What's Fair",
    description: "Get a fairness score, overpriced items flagged in red, and the fair price range.",
  },
  {
    icon: MessageSquareText,
    title: "Negotiate & Save",
    description: "Use our tailored negotiation scripts to push back and save hundreds or thousands.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "Austin, TX",
    saved: "$1,340",
    text: "My mechanic quoted me $2,800 for transmission work. QuoteCheck showed me the labor rate was 2x the area average. I negotiated it down to $1,460.",
  },
  {
    name: "James R.",
    location: "Denver, CO",
    saved: "$4,200",
    text: "Got a $22K quote for a bathroom remodel. QuoteCheck flagged the tile work and plumbing as way overpriced. Found a new contractor who did it for $17,800.",
  },
  {
    name: "Maria L.",
    location: "Miami, FL",
    saved: "$890",
    text: "My dentist wanted $2,100 for two crowns. QuoteCheck showed me the fair range was $1,100-$1,400. I switched dentists and saved almost $900.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Americans overpay $1,200/year on service quotes
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Is This Price{" "}
            <span className="text-primary relative">
              Fair?
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8 Q50 2 100 6 Q150 10 198 4" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <br />
            Find Out in Seconds.
          </h1>

          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-in-delay">
            Paste any service quote &mdash; car repairs, plumbing, dental work,
            renovations &mdash; and our AI instantly tells you if you&apos;re being
            overcharged. With line-by-line analysis and negotiation scripts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-dark transition shadow-lg shadow-blue-200"
            >
              Check a Quote Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-foreground px-8 py-4 rounded-xl text-lg font-semibold hover:border-primary hover:text-primary transition"
            >
              See How It Works
            </a>
          </div>

          <p className="text-sm text-muted mt-5">
            3 free checks per month &middot; No credit card required
          </p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="py-8 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-x-12 gap-y-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">$2.4M+</p>
            <p className="text-sm text-muted">Saved by users</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">50,000+</p>
            <p className="text-sm text-muted">Quotes analyzed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">4.9/5</p>
            <p className="text-sm text-muted flex items-center gap-1 justify-center">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> User rating
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">73%</p>
            <p className="text-sm text-muted">Quotes found overpriced</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Works With Any Service Quote
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">
            From a $200 plumbing fix to a $50K renovation &mdash; paste in the quote and get instant analysis.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition group"
              >
                <div className="p-3 rounded-lg bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition">
                  <cat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{cat.label}</h3>
                  <p className="text-sm text-muted mt-1">{cat.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-14">
            Four simple steps to know if your quote is fair.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-200">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            More Than a Price Check
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-14">
            QuoteCheck gives you everything you need to never overpay again.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="w-7 h-7" />}
              title="Fairness Score"
              description="Every quote gets a 1-10 fairness score with color coding. Green = fair. Yellow = slightly high. Red = you're being ripped off."
            />
            <FeatureCard
              icon={<Search className="w-7 h-7" />}
              title="Line-by-Line Breakdown"
              description="Each line item analyzed independently. See exactly which parts are overpriced and by how much."
            />
            <FeatureCard
              icon={<TrendingDown className="w-7 h-7" />}
              title="Fair Price Range"
              description="See the typical price range for your area based on zip code. Know exactly what you should be paying."
            />
            <FeatureCard
              icon={<MessageSquareText className="w-7 h-7" />}
              title="Negotiation Scripts"
              description="Get word-for-word scripts to negotiate your quote down. Tailored to your specific line items."
            />
            <FeatureCard
              icon={<FileText className="w-7 h-7" />}
              title="Quote History"
              description="Save and track all your analyzed quotes. Reference past analyses and see how much you've saved over time."
            />
            <FeatureCard
              icon={<Zap className="w-7 h-7" />}
              title="Instant Results"
              description="Analysis takes under 10 seconds. No waiting, no appointments, no phone calls. Just paste and know."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Real People, Real Savings
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-14">
            QuoteCheck users save an average of $840 per quote they negotiate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted mb-4">&quot;{t.text}&quot;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted">{t.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent font-bold text-lg">{t.saved}</p>
                    <p className="text-xs text-muted">saved</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-14">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 p-8">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <p className="text-sm text-muted mb-5">For occasional quote checks</p>
              <p className="text-4xl font-bold mb-6">
                $0<span className="text-base font-normal text-muted">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                <PricingItem text="3 quote checks per month" />
                <PricingItem text="Fairness score & price range" />
                <PricingItem text="Basic line-item analysis" />
                <PricingItem text="General negotiation tips" />
              </ul>
              <Link
                href="/analyze"
                className="block text-center py-3 rounded-xl border-2 border-gray-200 font-semibold hover:border-primary hover:text-primary transition"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-primary p-8 relative shadow-lg shadow-blue-100">
              <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <p className="text-sm text-muted mb-5">For anyone who hates overpaying</p>
              <p className="text-4xl font-bold mb-6">
                $9.99<span className="text-base font-normal text-muted">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                <PricingItem text="Unlimited quote checks" />
                <PricingItem text="Detailed line-item analysis" />
                <PricingItem text="Custom negotiation scripts" />
                <PricingItem text="Quote history & savings tracker" />
                <PricingItem text="Priority analysis speed" />
                <PricingItem text="Email & PDF reports" />
              </ul>
              <Link
                href="/analyze"
                className="block text-center py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
              >
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stop Overpaying. Start Checking.
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of smart consumers who check every quote before
            they pay. Your first 3 checks are completely free.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition shadow-lg"
          >
            Check Your First Quote
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}

function PricingItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
      {text}
    </li>
  );
}
