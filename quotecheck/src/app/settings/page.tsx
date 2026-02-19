"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordInput from "@/components/PasswordInput";
import {
  Loader2,
  Save,
  User,
  Lock,
  CreditCard,
  Trash2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";

const US_STATES = [
  { value: "", label: "Select state" },
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "Washington DC" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Usage state
  const [usage, setUsage] = useState<{
    quotesUsed: number;
    quotesLimit: number;
    quotesRemaining: number;
    isSubscribed: boolean;
  } | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/settings");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFullName(data.fullName || "");
          setEmail(data.email || "");
          setCity(data.city || "");
          setState(data.state || "");
          setZipCode(data.zipCode || "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }

    async function loadUsage() {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const res = await fetch("/api/usage/check", {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch (err) {
        console.error("Failed to load usage:", err);
      }
    }

    loadProfile();
    loadUsage();
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({ fullName, city, state, zipCode }),
      });

      if (res.ok) {
        setProfileMsg("Profile updated successfully!");
        setTimeout(() => setProfileMsg(""), 3000);
      } else {
        setProfileMsg("Failed to update profile.");
      }
    } catch {
      setProfileMsg("An error occurred.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordMsg("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordMsg(""), 3000);
      }
    } catch {
      setPasswordError("An error occurred.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (res.ok) {
        await signOut();
        router.push("/");
      }
    } catch {
      setDeleting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>

        {/* Profile Information */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
          </div>

          {profileLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Austin"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    {US_STATES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g. 78701"
                    pattern="\d{5}"
                    maxLength={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 text-sm ${profileMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>
                  {profileMsg.includes("success") && <CheckCircle className="w-4 h-4" />}
                  {profileMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </form>
          )}
        </section>

        {/* Change Password */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                New Password
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Confirm New Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                required
                minLength={8}
              />
            </div>

            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            {passwordMsg && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                {passwordMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60"
            >
              {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </button>
          </form>
        </section>

        {/* Subscription & Usage */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Subscription & Usage</h2>
          </div>

          {usage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Plan</span>
                <span className={`text-sm font-medium ${usage.isSubscribed ? "text-green-600" : "text-muted"}`}>
                  {usage.isSubscribed ? "Pro" : "No active plan"}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted">Monthly Usage</span>
                  <span className="text-sm font-medium text-foreground">
                    {usage.quotesUsed} / {usage.quotesLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${usage.quotesLimit > 0 ? Math.min((usage.quotesUsed / usage.quotesLimit) * 100, 100) : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  {usage.quotesRemaining} checks remaining this month
                </p>
              </div>

              {!usage.isSubscribed && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition"
                >
                  <BarChart3 className="w-4 h-4" />
                  Subscribe to Pro
                </Link>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-2xl border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          </div>

          <p className="text-sm text-muted mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          ) : (
            <div className="space-y-3 bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                Type DELETE to confirm account deletion:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full border border-red-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Delete
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
