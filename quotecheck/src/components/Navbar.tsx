"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Quote<span className="text-primary">Check</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/compare" className="text-sm text-muted hover:text-foreground transition">
              Compare
            </Link>
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground transition">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-sm text-muted hover:text-foreground transition">
              Pricing
            </Link>
            <Link
              href="/analyze"
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
            >
              Check a Quote
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pb-4">
          <div className="flex flex-col gap-3">
            <Link href="/compare" className="text-sm text-muted py-2" onClick={() => setMobileOpen(false)}>
              Compare Quotes
            </Link>
            <Link href="/dashboard" className="text-sm text-muted py-2" onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
            <Link href="/pricing" className="text-sm text-muted py-2" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
            <Link
              href="/analyze"
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-primary-dark transition"
              onClick={() => setMobileOpen(false)}
            >
              Check a Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
