"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2,
  Save,
  Mail,
  Zap,
  Bell,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

const CATEGORIES = [
  { key: "auto_repair", label: "Auto Repair" },
  { key: "plumbing", label: "Plumbing" },
  { key: "electrical", label: "Electrical" },
  { key: "dental", label: "Dental" },
  { key: "medical", label: "Medical" },
  { key: "home_renovation", label: "Home Renovation" },
  { key: "roofing", label: "Roofing" },
  { key: "hvac", label: "HVAC" },
  { key: "legal", label: "Legal" },
  { key: "wedding", label: "Wedding" },
  { key: "moving", label: "Moving" },
];

interface AutomationSettings {
  isEnabled: boolean;
  autoAnalyze: boolean;
  categoriesFilter: string[];
  minPriceThreshold: number;
  notificationEmail: string;
  notifyOnAnalysis: boolean;
  autoDraftReply: boolean;
  replyTemplate: string;
  forwardingEmail: string | null;
  isSetUp: boolean;
  verificationCode: string | null;
  verificationLink: string | null;
  verificationReceivedAt: string | null;
}

const DEFAULT_SETTINGS: AutomationSettings = {
  isEnabled: false,
  autoAnalyze: true,
  categoriesFilter: [],
  minPriceThreshold: 0,
  notificationEmail: "",
  notifyOnAnalysis: true,
  autoDraftReply: false,
  replyTemplate: "",
  forwardingEmail: null,
  isSetUp: false,
  verificationCode: null,
  verificationLink: null,
  verificationReceivedAt: null,
};

export default function AutomationSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AutomationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/settings/automation");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  async function loadSettings() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch("/api/email/settings", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setMsg("Session expired. Please log in again.");
        setMsgType("error");
        return;
      }

      const res = await fetch("/api/email/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({
          ...prev,
          forwardingEmail: data.forwardingEmail,
          isSetUp: true,
        }));
        setMsg("Settings saved successfully!");
        setMsgType("success");
      } else {
        const errData = await res.json().catch(() => ({}));
        setMsg(errData.error || "Failed to save settings.");
        setMsgType("error");
      }
    } catch (err) {
      console.error("Save error:", err);
      setMsg("Failed to save settings.");
      setMsgType("error");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 5000);
    }
  }

  function toggleCategory(key: string) {
    setSettings((prev) => ({
      ...prev,
      categoriesFilter: prev.categoriesFilter.includes(key)
        ? prev.categoriesFilter.filter((c) => c !== key)
        : [...prev.categoriesFilter, key],
    }));
  }

  function copyEmail() {
    if (settings.forwardingEmail) {
      navigator.clipboard.writeText(settings.forwardingEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Email Automation
          </h1>
          <p className="text-sm text-muted mt-1">
            Forward quotes to your unique email address and get instant AI
            analysis.
          </p>
        </div>

        {/* Email Connection */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Email Connection
            </h2>
          </div>

          <div className="space-y-4">
            {/* Enable toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-foreground">
                Enable email automation
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      isEnabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            {/* Forwarding address */}
            {settings.isSetUp && settings.forwardingEmail ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Your forwarding address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={settings.forwardingEmail}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 font-mono"
                  />
                  <button
                    onClick={copyEmail}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Click &quot;Save Settings&quot; to generate your unique forwarding
                    address.
                  </p>
                </div>
              </div>
            )}

            {/* Setup instructions */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition"
            >
              {showInstructions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              How to set up email forwarding
            </button>

            {showInstructions && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 text-sm text-muted">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <p className="text-xs text-blue-800">
                    <strong>AI-powered filtering:</strong> You can forward all your emails &mdash; our AI automatically
                    detects quotes, estimates, and invoices. Non-quote emails are skipped at no cost.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Gmail:</p>
                  <ol className="list-decimal ml-4 space-y-1.5">
                    <li>
                      Go to Gmail <strong>Settings</strong> &rarr; <strong>Forwarding and POP/IMAP</strong>
                    </li>
                    <li>
                      Click <strong>&quot;Add a forwarding address&quot;</strong> and paste your QuoteCheck email above
                    </li>
                    <li>
                      Gmail will send a verification code to your phone or email &mdash; confirm it
                    </li>
                    <li>
                      Select <strong>&quot;Forward a copy of incoming mail to&quot;</strong> your QuoteCheck address
                    </li>
                    <li>
                      Choose <strong>&quot;keep Gmail&apos;s copy in the Inbox&quot;</strong> and save
                    </li>
                  </ol>
                  <p className="text-xs text-muted mt-2 italic">
                    That&apos;s it! Our AI will automatically detect and analyze any quotes or invoices.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Outlook:
                  </p>
                  <ol className="list-decimal ml-4 space-y-1.5">
                    <li>Go to <strong>Settings</strong> &rarr; <strong>Mail</strong> &rarr; <strong>Forwarding</strong></li>
                    <li>Check <strong>&quot;Enable forwarding&quot;</strong></li>
                    <li>Enter your QuoteCheck email address</li>
                    <li>Check <strong>&quot;Keep a copy of forwarded messages&quot;</strong> and save</li>
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Apple Mail:
                  </p>
                  <ol className="list-decimal ml-4 space-y-1.5">
                    <li>Go to <strong>Mail</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Rules</strong></li>
                    <li>Click <strong>&quot;Add Rule&quot;</strong></li>
                    <li>Set condition: <strong>&quot;Every message&quot;</strong></li>
                    <li>Set action: <strong>Redirect Message</strong> to your QuoteCheck email</li>
                  </ol>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <p className="font-semibold text-foreground mb-1">
                    Or forward specific senders only:
                  </p>
                  <p className="text-xs">
                    If you prefer, create a filter in your email app to only forward emails from specific contractors
                    or containing keywords like &quot;quote&quot;, &quot;estimate&quot;, or &quot;invoice&quot;.
                  </p>
                </div>
              </div>
            )}

            {/* Gmail verification code or link */}
            {verificationConfirmed ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-green-800">
                    Gmail Forwarding Confirmed
                  </p>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Your forwarding address is verified. Make sure &quot;Forward a copy of incoming mail&quot; is selected in Gmail settings.
                </p>
              </div>
            ) : settings.verificationCode ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Gmail Verification Code
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Gmail sent a confirmation email. Enter this code in Gmail to verify the forwarding address.
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-white border border-amber-300 rounded-lg px-4 py-2 text-lg font-bold font-mono text-amber-900 tracking-widest">
                    {settings.verificationCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(settings.verificationCode!);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 px-3 py-2 border border-amber-300 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-100 transition"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                {settings.verificationReceivedAt && (
                  <p className="text-xs text-amber-600 mt-2">
                    Received {new Date(settings.verificationReceivedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (settings.verificationLink || settings.verificationReceivedAt) ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Gmail Verification Required
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Gmail sent a confirmation link. Click the button below to verify your forwarding address.
                </p>
                {settings.verificationLink ? (
                  <a
                    href={settings.verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setVerificationConfirmed(true)}
                    className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-700 transition"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Forwarding in Gmail
                  </a>
                ) : (
                  <p className="text-xs text-amber-700">
                    Check your Gmail app or phone — you may be able to confirm the forwarding directly there.
                  </p>
                )}
                {settings.verificationReceivedAt && (
                  <p className="text-xs text-amber-600 mt-2">
                    Received {new Date(settings.verificationReceivedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </section>

        {/* Analysis Settings */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Analysis Settings
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-foreground block">
                  Auto-analyze incoming quotes
                </span>
                <span className="text-xs text-muted">
                  Automatically run analysis when a quote email is received
                </span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.autoAnalyze}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoAnalyze: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            {/* Category filters */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category filters{" "}
                <span className="text-xs text-muted font-normal">
                  (leave empty to analyze all categories)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${
                      settings.categoriesFilter.includes(cat.key)
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-gray-200 text-muted hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings.categoriesFilter.includes(cat.key)}
                      onChange={() => toggleCategory(cat.key)}
                      className="sr-only"
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Min price threshold */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Minimum price threshold
              </label>
              <p className="text-xs text-muted mb-1.5">
                Skip analysis for quotes below this amount
              </p>
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={settings.minPriceThreshold || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minPriceThreshold: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-foreground block">
                  Email me when analysis completes
                </span>
                <span className="text-xs text-muted">
                  Get a summary with score, verdict, and savings
                </span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.notifyOnAnalysis}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifyOnAnalysis: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Notification email
              </label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    notificationEmail: e.target.value,
                  }))
                }
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Reply Templates */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Reply Templates
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-foreground block">
                  Auto-draft replies
                </span>
                <span className="text-xs text-muted">
                  Automatically generate a negotiation reply for each analyzed
                  quote
                </span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.autoDraftReply}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoDraftReply: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Custom reply template{" "}
                <span className="text-xs text-muted font-normal">
                  (optional)
                </span>
              </label>
              <p className="text-xs text-muted mb-1.5">
                Set the tone and style for auto-generated replies. Leave blank
                for default professional tone.
              </p>
              <textarea
                value={settings.replyTemplate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    replyTemplate: e.target.value,
                  }))
                }
                rows={4}
                placeholder="e.g., Keep it friendly but firm. Mention I'm comparing 3 quotes. Always ask about cash discounts."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </button>
          {msg && (
            <span
              className={`text-sm ${
                msgType === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {msg}
            </span>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
