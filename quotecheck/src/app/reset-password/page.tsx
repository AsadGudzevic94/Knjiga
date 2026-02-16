"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    function markReady() {
      readyRef.current = true;
      setReady(true);
    }

    // 1. Check URL hash for recovery tokens
    // Supabase redirects with: /reset-password#access_token=xxx&type=recovery
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("access_token"))) {
      markReady();
    }

    // 2. Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        markReady();
      }
    });

    // 3. If we already have a session (token was processed), show the form
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        markReady();
      }
    });

    // 4. If nothing works after 5s, link is expired/invalid
    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        setExpired(true);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Quote<span className="text-primary">Check</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Set new password</h1>
          <p className="text-sm text-muted mt-1">
            Choose a strong password for your account
          </p>
        </div>

        {expired ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-500">
              This reset link has expired or is invalid.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block text-sm text-primary hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : !ready ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted">Verifying your reset link...</p>
          </div>
        ) : success ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 text-left">
                Password updated! Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                New Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Confirm Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={8}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
