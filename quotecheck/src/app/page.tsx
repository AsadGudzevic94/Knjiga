import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveDemoWrapper from "@/components/LiveDemoWrapper";
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
              Start Checking Quotes
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

      {/* Live Demo */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            See It In Action
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">
            Watch QuoteCheck analyze a real auto repair quote in real time.
          </p>
          <LiveDemoWrapper />
        </div>
      </section>

      {/* New features highlight */}
      <section className="py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/analyze"
              className="group p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-primary/30 transition"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-foreground mb-2">Receipt Scanner</h3>
              <p className="text-sm text-muted">
                Snap a photo of any receipt or quote. Our OCR reads it instantly &mdash; no typing needed.
              </p>
            </Link>

            <Link
              href="/compare"
              className="group p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-primary/30 transition"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h3 className="font-bold text-foreground mb-2">Compare Quotes</h3>
              <p className="text-sm text-muted">
                Got multiple quotes? Compare them side-by-side and instantly see which is the best deal.
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="group p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-primary/30 transition"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-foreground mb-2">Savings Dashboard</h3>
              <p className="text-sm text-muted">
                Track every quote you&apos;ve checked. See your total savings grow with charts and analytics.
              </p>
            </Link>
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
          <div className="inline-flex items-center gap-2 bg-blue-100 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4 mx-auto block w-fit">
            <Zap className="w-4 h-4" />
            No free trials. No games. Just honest pricing.
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-8">
            One quote check can save you hundreds. The Pro plan pays for itself with a single use.
          </p>

          {/* Why No Free Tier - Compact Version */}
          <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mb-14">
            <p className="text-sm text-muted leading-relaxed">
              <strong className="text-foreground">Why no free tier?</strong> In today's era of AI bots, bad actors can create thousands of fake accounts to abuse free tiers. We believe in honest pricing: you pay a fair price, we deliver premium AI-powered analysis without compromises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Pro Monthly */}
            <div className="rounded-2xl border border-gray-200 p-8 flex flex-col">
              <h3 className="text-lg font-semibold mb-1">Pro Monthly</h3>
              <p className="text-sm text-muted mb-5">For anyone who hates overpaying</p>
              <p className="text-4xl font-bold mb-1">
                $20<span className="text-base font-normal text-muted">/mo</span>
              </p>
              <div className="h-6 mb-5"></div>
              <ul className="space-y-3 mb-8 flex-grow">
                <PricingItem text="500 quote checks per month" />
                <PricingItem text="Detailed line-item analysis" />
                <PricingItem text="Custom negotiation scripts" />
                <PricingItem text="Quote history & savings tracker" />
                <PricingItem text="Priority analysis speed" />
                <PricingItem text="Email & PDF reports" />
              </ul>
              <Link
                href="/pricing"
                className="block text-center py-3 rounded-xl border-2 border-gray-200 font-semibold hover:border-primary hover:text-primary transition"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Annual */}
            <div className="rounded-2xl border-2 border-primary p-8 relative shadow-lg shadow-blue-100 flex flex-col">
              <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold mb-1">Pro Annual</h3>
              <p className="text-sm text-muted mb-5">Best value - save 50%</p>
              <p className="text-4xl font-bold mb-1">
                $10<span className="text-base font-normal text-muted">/mo</span>
              </p>
              <div className="h-6 mb-5">
                <p className="text-xs text-muted">Billed as $120/year</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <PricingItem text="500 quote checks per month" />
                <PricingItem text="Save 50% vs monthly" />
                <PricingItem text="All Pro Monthly features" />
                <PricingItem text="Priority support" />
                <PricingItem text="Early access to new features" />
                <PricingItem text="Exclusive price database" />
              </ul>
              <Link
                href="/pricing"
                className="block text-center py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
              >
                Get Started
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
            Join thousands of smart consumers who check every quote before they pay.
            One quote check can save you hundreds of dollars.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              View Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-800 transition border border-blue-500"
            >
              Sign In
            </Link>
          </div>
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
