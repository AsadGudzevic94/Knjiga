"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, ShieldCheck, User, LogOut, Settings, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`text-sm cursor-pointer transition ${
        isActive
          ? "text-primary font-semibold"
          : "text-muted hover:text-foreground"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`text-sm py-2.5 px-3 rounded-lg cursor-pointer transition ${
        isActive
          ? "text-primary font-semibold bg-blue-50"
          : "text-muted hover:text-foreground hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setUserMenuOpen(false);
    router.push("/");
  }

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
            <NavLink href="/compare">Compare</NavLink>
            <NavLink href="/prices">Community Prices</NavLink>
            <NavLink href="/trends">Trends</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    {/* Backdrop to close menu when clicking outside */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-gray-50 hover:text-foreground transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <Link
                        href="/settings/automation"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-gray-50 hover:text-foreground transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Zap className="w-4 h-4" />
                        Automation
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted hover:text-foreground transition">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
                >
                  Sign Up
                </Link>
              </>
            )}
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
          <div className="flex flex-col gap-1">
            <MobileNavLink href="/compare" onClick={() => setMobileOpen(false)}>Compare Quotes</MobileNavLink>
            <MobileNavLink href="/prices" onClick={() => setMobileOpen(false)}>Community Prices</MobileNavLink>
            <MobileNavLink href="/trends" onClick={() => setMobileOpen(false)}>Trends</MobileNavLink>
            <MobileNavLink href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
            <MobileNavLink href="/pricing" onClick={() => setMobileOpen(false)}>Pricing</MobileNavLink>

            {user ? (
              <>
                <div className="border-t border-gray-100 pt-3 mt-2">
                  <p className="text-xs text-muted px-2 mb-2">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-sm text-muted py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <Link
                  href="/settings/automation"
                  className="flex items-center gap-2 text-sm text-muted py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Zap className="w-4 h-4" />
                  Automation
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm text-red-600 py-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted py-2" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-primary-dark transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
