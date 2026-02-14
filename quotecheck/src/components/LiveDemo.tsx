"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShieldCheck, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

const SAMPLE_QUOTE = `Smith's Auto - Brake Service
Brake pads (front) - $420
Rotor resurfacing - $310
Brake fluid flush - $150
Labor (2 hrs @ $160/hr) - $320
Shop fees - $65
Total: $1,265`;

const TYPING_SPEED = 28; // ms per character
const ANALYZING_DURATION = 1800; // ms
const RESULT_DISPLAY_DURATION = 6000; // ms
const SCORE_ANIMATION_DURATION = 1200; // ms

type Phase = "typing" | "analyzing" | "result";

interface LineItem {
  name: string;
  status: "overpriced" | "high" | "fair";
  label: string;
  delta?: string;
}

const LINE_ITEMS: LineItem[] = [
  { name: "Brake pads (front)", status: "overpriced", label: "Overpriced", delta: "+38%" },
  { name: "Rotor resurfacing", status: "fair", label: "Fair price" },
  { name: "Brake fluid flush", status: "fair", label: "Fair price" },
  { name: "Labor rate", status: "high", label: "Slightly high", delta: "+18%" },
];

function ScoreRing({ targetScore, animate }: { targetScore: number; animate: boolean }) {
  const [currentScore, setCurrentScore] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setCurrentScore(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    const step = (timestamp: number) => {
      const elapsed = timestamp - (startTimeRef.current || timestamp);
      const progress = Math.min(elapsed / SCORE_ANIMATION_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrentScore(eased * targetScore);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate, targetScore]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const fraction = currentScore / 10;
  const strokeDashoffset = circumference * (1 - fraction);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#eab308"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">
          {currentScore.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500 font-medium">/10</span>
      </div>
    </div>
  );
}

function StatusBadge({ item, index }: { item: LineItem; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  const statusStyles = {
    overpriced: "bg-red-50 border-red-200 text-red-700",
    high: "bg-amber-50 border-amber-200 text-amber-700",
    fair: "bg-green-50 border-green-200 text-green-700",
  };

  const iconMap = {
    overpriced: <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    high: <TrendingDown className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    fair: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
  };

  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-500 ${
        statusStyles[item.status]
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <div className="flex items-center gap-2">
        {iconMap[item.status]}
        <span className="text-sm font-medium">{item.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {item.delta && (
          <span className="text-xs font-semibold">{item.delta}</span>
        )}
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 font-medium">
          {item.label}
        </span>
      </div>
    </div>
  );
}

export default function LiveDemo() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedLength, setTypedLength] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [savingsVisible, setSavingsVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    setPhase("typing");
    setTypedLength(0);
    setShowResult(false);
    setAnimateScore(false);
    setSavingsVisible(false);
  }, []);

  // Typing phase
  useEffect(() => {
    if (phase !== "typing") return;

    intervalRef.current = setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= SAMPLE_QUOTE.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => setPhase("analyzing"), 400);
          return prev;
        }
        return prev + 1;
      });
    }, TYPING_SPEED);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  // Analyzing phase
  useEffect(() => {
    if (phase !== "analyzing") return;

    const timer = setTimeout(() => {
      setPhase("result");
      setShowResult(true);
      setTimeout(() => setAnimateScore(true), 200);
      setTimeout(() => setSavingsVisible(true), 800);
    }, ANALYZING_DURATION);

    return () => clearTimeout(timer);
  }, [phase]);

  // Loop: reset after result is displayed
  useEffect(() => {
    if (phase !== "result") return;

    const timer = setTimeout(() => {
      reset();
    }, RESULT_DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [phase, reset]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-gray-400 font-medium tracking-wide">
              QuoteCheck Demo
            </span>
          </div>
          <div className="w-12" />
        </div>

        <div className="p-5 sm:p-6 min-h-[420px]">
          {/* Typing / Analyzing phase */}
          {(phase === "typing" || phase === "analyzing") && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Paste your quote
              </label>
              <div className="relative">
                <div className="w-full min-h-[200px] p-4 rounded-xl border border-gray-200 bg-gray-50 font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {SAMPLE_QUOTE.slice(0, typedLength)}
                  {phase === "typing" && (
                    <span className="inline-block w-0.5 h-4 bg-primary align-text-bottom ml-px animate-pulse" />
                  )}
                </div>
              </div>

              {phase === "analyzing" && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="relative w-5 h-5">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 animate-pulse">
                    Analyzing your quote against market data...
                  </span>
                </div>
              )}

              {phase === "typing" && (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-gray-200 text-gray-400 text-sm font-medium cursor-not-allowed"
                >
                  Analyze Quote
                </button>
              )}
            </div>
          )}

          {/* Result phase */}
          {phase === "result" && (
            <div
              className={`space-y-5 transition-all duration-700 ${
                showResult ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {/* Score + summary row */}
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <ScoreRing targetScore={5} animate={animateScore} />
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      Slightly Overpriced
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Fair market range:{" "}
                    <span className="font-semibold text-gray-700">$780 &ndash; $1,050</span>
                  </p>

                  {/* Savings callout */}
                  <div
                    className={`inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-lg bg-green-50 border border-green-200 transition-all duration-700 ${
                      savingsVisible
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-90"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      Potential savings: $287
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Line items */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Line Item Breakdown
                </h4>
                <div className="space-y-2">
                  {LINE_ITEMS.map((item, i) => (
                    <StatusBadge key={item.name} item={item} index={i} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle loop indicator */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-1.5">
          {(["typing", "analyzing", "result"] as Phase[]).map((p) => (
            <span
              key={p}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                phase === p ? "bg-primary w-4" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
