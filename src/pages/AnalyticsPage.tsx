import React from "react";
import {
  Award,
  CheckCircle2,
  GraduationCap,
  Target,
  TrendingUp,
} from "lucide-react";
import { Subject } from "../types";
import { parseSubjectMeta } from "../utils";
import { StatCard } from "../components/StatCard";
import { ProgressBar } from "../components/ProgressBar";

interface AnalyticsPageProps {
  subjects: Subject[];
  totalUnits: number;
  completedUnits: number;
  progress: number;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  subjects,
  totalUnits,
  completedUnits,
  progress,
}) => {
  const pendingUnits = totalUnits - completedUnits;

  // Fully completed subjects
  const completedSubjectsCount = subjects.filter(
    (s) => s.units.length > 0 && s.units.every((u) => u.is_completed)
  ).length;

  // Ranked subjects for insights
  const ranked = [...subjects].sort((a, b) => {
    const aRate = a.total_units
      ? a.units.filter((u) => u.is_completed).length / a.total_units
      : 0;
    const bRate = b.total_units
      ? b.units.filter((u) => u.is_completed).length / b.total_units
      : 0;
    return bRate - aRate;
  });

  const bestSubject = ranked[0];
  const lowestSubject = ranked[ranked.length - 1];

  const bestCompleted = bestSubject?.units.filter((u) => u.is_completed).length ?? 0;
  const bestRate = bestSubject?.total_units
    ? Math.round((bestCompleted / bestSubject.total_units) * 100)
    : 0;

  const lowestCompleted = lowestSubject?.units.filter((u) => u.is_completed).length ?? 0;
  const lowestRate = lowestSubject?.total_units
    ? Math.round((lowestCompleted / lowestSubject.total_units) * 100)
    : 0;

  // SVG Circular Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-8 animate-rise-in select-none text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/15 px-3.5 py-1 text-[11px] font-bold text-[#A78BFA] tracking-wider uppercase mb-3 shadow-sm">
            <TrendingUp size={12} strokeWidth={2.4} />
            Performance Insights
          </div>
          <h1 className="font-display text-[28px] md:text-[34px] font-extrabold tracking-tight text-white">
            Study Analytics
          </h1>
          <p className="mt-1 text-[14px] text-white/50">
            Data-backed metrics derived directly from your saved syllabus records.
          </p>
        </div>
      </div>

      {/* Top 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Overall Completion"
          value={`${progress}%`}
          detail={`${completedUnits} of ${totalUnits} units`}
          icon={TrendingUp}
          trend={progress > 0 ? "up" : "neutral"}
          highlight={true}
        />
        <StatCard
          label="Completed Units"
          value={completedUnits}
          detail="Studied so far"
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending Units"
          value={pendingUnits}
          detail="Remaining to study"
          icon={Target}
        />
        <StatCard
          label="Completed Courses"
          value={`${completedSubjectsCount}/${subjects.length}`}
          detail="Full mastery"
          icon={GraduationCap}
        />
      </div>

      {/* Analytics Main Two-Column Row */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left Column: Circular Progress Gauge & Summary */}
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col md:flex-row items-center gap-8 shadow-smoked-glass">
          {/* Radial SVG Gauge */}
          <div className="relative flex shrink-0 items-center justify-center">
            <svg width="160" height="160" className="rotate-[-90deg]">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-white/10"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="url(#analyticsGradient)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="analyticsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B96F" />
                  <stop offset="50%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>

            {/* Central Stat */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-display text-[32px] font-black text-white tracking-tight">
                {progress}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Syllabus
              </span>
            </div>
          </div>

          {/* Gauge Summary Insights */}
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="font-display text-[18px] font-bold text-white tracking-tight">
                Semester Readiness Status
              </h2>
              <p className="text-[13px] text-white/50 mt-1 leading-relaxed">
                {progress >= 75
                  ? "Outstanding velocity. Your preparation puts you firmly on track for your 9+ CGPA semester target."
                  : progress >= 40
                  ? "Solid foundational coverage. Prioritize remaining units in courses with the nearest exam dates."
                  : "Early preparation stage. Establish a regular study cadence to complete pending units."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <div className="text-[10px] uppercase font-bold text-white/40">Highest Coverage</div>
                <div className="font-display text-[14px] font-bold text-[#10B96F] truncate mt-0.5">
                  {bestSubject ? parseSubjectMeta(bestSubject.subject_name).displayName : "—"}
                </div>
                <div className="text-[11px] font-mono text-white/50">{bestRate}% done</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <div className="text-[10px] uppercase font-bold text-white/40">Needs Focus</div>
                <div className="font-display text-[14px] font-bold text-[#A78BFA] truncate mt-0.5">
                  {lowestSubject ? parseSubjectMeta(lowestSubject.subject_name).displayName : "—"}
                </div>
                <div className="text-[11px] font-mono text-white/50">{lowestRate}% done</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic Target Milestones */}
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col justify-between shadow-smoked-glass">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30">
                <Award size={15} />
              </span>
              <h3 className="font-display text-[16px] font-bold text-white">
                CGPA Target Milestones
              </h3>
            </div>

            <p className="text-[13px] text-white/50 mb-5 leading-relaxed">
              Targeting 9+ CGPA requires consistent unit completion across all 5 core subjects before exam week starts.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-[12px] p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <span className="text-white/80 font-medium">1. Complete 10 Units</span>
                <span
                  className={`font-mono font-bold ${
                    completedUnits >= 10 ? "text-[#10B96F]" : "text-white/40"
                  }`}
                >
                  {completedUnits >= 10 ? "Achieved ✓" : `${completedUnits}/10`}
                </span>
              </div>

              <div className="flex items-center justify-between text-[12px] p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <span className="text-white/80 font-medium">2. Complete 18 Units (75%)</span>
                <span
                  className={`font-mono font-bold ${
                    completedUnits >= 18 ? "text-[#10B96F]" : "text-white/40"
                  }`}
                >
                  {completedUnits >= 18 ? "Achieved ✓" : `${completedUnits}/18`}
                </span>
              </div>

              <div className="flex items-center justify-between text-[12px] p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <span className="text-white/80 font-medium">3. Full Mastery (24 Units)</span>
                <span
                  className={`font-mono font-bold ${
                    completedUnits === 24 ? "text-[#10B96F]" : "text-white/40"
                  }`}
                >
                  {completedUnits === 24 ? "Achieved ✓" : `${completedUnits}/24`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course-by-Course Progress Breakdown */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 shadow-smoked-glass">
        <h2 className="font-display text-[18px] font-bold text-white mb-6 tracking-tight">
          Course-by-Course Progress Breakdown
        </h2>

        <div className="space-y-4">
          {subjects.map((subject) => {
            const meta = parseSubjectMeta(subject.subject_name);
            const done = subject.units.filter((u) => u.is_completed).length;
            const rate = subject.total_units ? Math.round((done / subject.total_units) * 100) : 0;

            return (
              <div
                key={subject.id}
                className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                  <div className="btn-float flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-[12px] font-bold text-white">
                    {meta.code}
                  </div>
                  <div className="truncate">
                    <div className="font-display text-[14px] font-bold text-white truncate">
                      {meta.displayName}
                    </div>
                    <div className="text-[11px] text-white/40">{meta.category}</div>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <ProgressBar value={rate} size="sm" />
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end shrink-0 md:w-32">
                  <span className="text-[12px] font-mono text-white/50">
                    {done}/{subject.total_units} units
                  </span>
                  <span className="font-mono text-[14px] font-bold text-[#10B96F]">{rate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
