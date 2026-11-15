import React, { FormEvent, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { GlassShardHero } from "../components/GlassShardHero";

interface AuthScreenProps {
  supabase: SupabaseClient;
  error: string;
  onError: (msg: string) => void;
  onClearError: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  supabase,
  error,
  onError,
  onClearError,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showFull3DHero, setShowFull3DHero] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    onClearError();

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (result.error) {
      onError(result.error.message);
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Please check your email to confirm, then sign in below.");
    }
  };

  if (showFull3DHero) {
    return (
      <GlassShardHero
        showBackToDashboard
        onClose={() => setShowFull3DHero(false)}
        onSignIn={() => setShowFull3DHero(false)}
        onOpenStudio={() => setShowFull3DHero(false)}
      />
    );
  }

  return (
    <div className="facet-canvas min-h-screen flex flex-col lg:flex-row text-white relative overflow-hidden">
      <div className="absolute -bottom-40 right-1/4 w-[520px] h-[520px] rounded-full bg-[#16C784]/[0.035] blur-[120px] pointer-events-none" />

      {/* Left Column: Glass Shard Hero Feature View */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 xl:p-16 relative z-10 border-b lg:border-b-0 lg:border-r border-white/10">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/15 shadow-smoked-glass">
              <GraduationCap size={22} className="text-[#16C784]" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-display text-[18px] font-extrabold tracking-[0.14em] text-white">
                SEMTRACK
              </div>
              <div className="text-[10px] uppercase font-bold tracking-[0.16em] text-white/50">
                Midnight Glass Academic OS
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFull3DHero(true)}
            className="btn-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
          >
            <Sparkles size={13} className="text-[#16C784]" />
            <span>Interactive 3D Shards</span>
          </button>
        </div>

        {/* Center Main Punchline */}
        <div className="my-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-[#16C784]/25 px-3.5 py-1 text-[11px] font-bold text-[#16C784] tracking-wider uppercase">
            <Target size={13} strokeWidth={2.5} />
            Semester Goal: 9+ CGPA
          </div>

          <h1 className="font-display text-[36px] md:text-[46px] font-extrabold leading-[1.08] text-white tracking-tight">
            Designed in glass.<br />
            <span className="text-[#A0A8B4]">
              Engineered for exams.
            </span>
          </h1>

          <p className="text-[15px] leading-relaxed text-white/60">
            Distraction-free preparation for your end-semesters. Organize 24 units across Theory of Computation, AI, Computer Networks, Cloud Computing, and IPR with live countdowns and instant cloud sync.
          </p>

          {/* Quick Course Highlights in Smoked Glass Cards */}
          <div className="pt-2 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-smoked-glass">
              <BookOpen size={18} className="text-[#16C784] mb-2" />
              <div className="font-display text-[14px] font-bold text-white">5 Core Courses</div>
              <div className="text-[11px] text-white/50 mt-0.5">TOC, AI, Networks, Cloud & IPR</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-smoked-glass">
              <CalendarDays size={18} className="text-[#16C784] mb-2" />
              <div className="font-display text-[14px] font-bold text-white">Exam Timetable</div>
              <div className="text-[11px] text-white/50 mt-0.5">IST live countdown engine</div>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="text-[12px] text-white/40 flex items-center justify-between border-t border-white/10 pt-5">
          <span>Midnight Glass Academic System</span>
          <span className="flex items-center gap-1.5 text-[#16C784] font-mono text-[11px]">
            <ShieldCheck size={14} /> Cloud Synced
          </span>
        </div>
      </div>

      {/* Right Column: Smoked Glass Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[430px] space-y-6">
          <div className="glass-deep rounded-3xl p-7 md:p-9 border border-white/15 shadow-smoked-deep">
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-black/40 p-1 mb-6 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  onClearError();
                  setMessage("");
                }}
                className={`flex-1 py-2 text-[12px] font-bold rounded-xl transition-all ${
                  mode === "signin"
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  onClearError();
                  setMessage("");
                }}
                className={`flex-1 py-2 text-[12px] font-bold rounded-xl transition-all ${
                  mode === "signup"
                    ? "bg-[#16C784] text-[#080A0E] font-extrabold"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-6">
              <h2 className="font-display text-[22px] font-bold text-white">
                {mode === "signin" ? "Welcome back" : "Create student account"}
              </h2>
              <p className="text-[12px] text-white/50 mt-1">
                {mode === "signin"
                  ? "Sign in to resume tracking your semester progress."
                  : "All 5 courses and 24 units are provisioned automatically."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-white/80 mb-1.5">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <Mail
                    size={18}
                    strokeWidth={1.8}
                    className="input-icon"
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="glass-input glass-input--icon h-11 w-full pr-4 text-[13px] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-white/80 mb-1.5">
                  Password
                </label>
                <div className="input-wrapper">
                  <Lock
                    size={18}
                    strokeWidth={1.8}
                    className="input-icon"
                  />
                  <input
                    required
                    minLength={6}
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="glass-input glass-input--icon h-11 w-full pr-4 text-[13px] font-medium"
                  />
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-white/10 bg-[#171C24] p-3 text-[12px] font-medium text-[#F5F6F8]"
                >
                  {error}
                </div>
              )}

              {/* Success Message */}
              {message && (
                <div
                  role="status"
                  className="rounded-xl border border-[#16C784]/25 bg-[#16C784]/[0.08] p-3 text-[12px] font-medium text-[#16C784]"
                >
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#16C784] hover:opacity-90 text-[#080A0E] text-[13px] font-bold active:scale-[0.98] transition disabled:opacity-60"
              >
                <span>
                  {loading
                    ? "Authenticating..."
                    : mode === "signin"
                    ? "Sign In to Dashboard"
                    : "Register Account"}
                </span>
                <ArrowRight size={15} />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck size={13} className="text-[#16C784]" />
              <span>Protected by Supabase Row-Level Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
