import React from "react";
import {
  Cloud,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sun,
  User,
} from "lucide-react";

interface SettingsPageProps {
  email: string;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  resetAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  email,
  darkMode,
  setDarkMode,
  resetAll,
}) => {
  return (
    <div className="space-y-8 animate-rise-in max-w-4xl select-none text-white">
      {/* Page Header */}
      <div className="pb-2 border-b border-white/10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1 text-[11px] font-bold text-[#16C784] tracking-wider uppercase mb-3">
          <Sliders size={12} strokeWidth={2.4} />
          Configuration
        </div>
        <h1 className="font-display text-[28px] md:text-[34px] font-extrabold tracking-tight text-white">
          Preferences & Settings
        </h1>
        <p className="mt-1 text-[14px] text-white/50">
          Customize your study experience and manage account database records.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <section className="glass-card rounded-3xl p-6 md:p-7 border border-white/10 shadow-smoked-glass">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[14px] font-bold text-white">
                <Sun size={17} className="text-[#16C784]" />
                <span>Appearance & Theme</span>
              </div>
              <p className="mt-1 text-[12px] text-white/50">
                Choose standard glass surfaces or a higher-contrast dark theme.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setDarkMode(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                  darkMode
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <Moon size={14} className="text-[#16C784]" />
                Midnight Glass
              </button>
              <button
                type="button"
                onClick={() => setDarkMode(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                  !darkMode
                    ? "bg-[#16C784] text-[#080A0E]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <Sun size={14} />
                High Contrast Dark
              </button>
            </div>
          </div>
        </section>

        {/* User Account Section */}
        <section className="glass-card rounded-3xl p-6 md:p-7 border border-white/10 shadow-smoked-glass">
          <div className="flex items-center gap-2 text-[14px] font-bold text-white mb-1">
            <User size={17} className="text-[#16C784]" />
            <span>Account Profile</span>
          </div>
          <p className="text-[12px] text-white/50 mb-4">
            Your study progress, exam dates, and unit checks are bound to this authenticated account.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Signed In As
              </div>
              <div className="font-display text-[15px] font-bold text-white mt-0.5">
                {email || "Student Account"}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-[#16C784] font-mono">
              <ShieldCheck size={16} />
              <span>Row-Level Security Active</span>
            </div>
          </div>
        </section>

        {/* Database & Sync Status */}
        <section className="glass-card rounded-3xl p-6 md:p-7 border border-white/10 shadow-smoked-glass">
          <div className="flex items-center gap-2 text-[14px] font-bold text-white mb-1">
            <Cloud size={17} className="text-[#16C784]" />
            <span>Cloud Database Sync</span>
          </div>
          <p className="text-[12px] text-white/50 mb-4">
            SEMTRACK is connected to Supabase PostgreSQL with real-time replication.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
              <div className="text-white/40 text-[10px] uppercase font-bold">5 Courses</div>
              <div className="font-bold text-white mt-0.5">Provisioned</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
              <div className="text-white/40 text-[10px] uppercase font-bold">24 Units</div>
              <div className="font-bold text-[#16C784] mt-0.5">Synced</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
              <div className="text-white/40 text-[10px] uppercase font-bold">Timetable</div>
              <div className="font-bold text-[#16C784] mt-0.5">IST Auto-calc</div>
            </div>
          </div>
        </section>

        {/* Danger Zone: Reset Syllabus Progress */}
        <section className="rounded-3xl p-6 md:p-7 border border-white/10 bg-[#11151C]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[14px] font-bold text-white">
                Reset All Syllabus Progress
              </div>
              <p className="text-[12px] text-white/50 mt-1 max-w-lg">
                Uncheck all 24 units across all 5 subjects in your database account. Exam timetable dates will remain unchanged.
              </p>
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="btn-float flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#A0A8B4] hover:text-white text-[12px] font-bold transition shrink-0"
            >
              <RotateCcw size={14} />
              <span>Reset Progress</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
