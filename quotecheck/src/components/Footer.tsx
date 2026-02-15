import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
              <span className="text-lg font-bold text-white">
                Quote<span className="text-primary">Check</span>
              </span>
            </Link>
            <p className="text-sm max-w-md">
              Stop overpaying for services. QuoteCheck uses AI to analyze any
              service quote and tell you if the price is fair for your area.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><Link href="/analyze" className="hover:text-white transition">Analyze a Quote</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition cursor-default">Auto Repair</span></li>
              <li><span className="hover:text-white transition cursor-default">Home Services</span></li>
              <li><span className="hover:text-white transition cursor-default">Medical & Dental</span></li>
              <li><span className="hover:text-white transition cursor-default">Legal Fees</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} QuoteCheck. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
