import React from "react";
import {
  CalendarDays,
  Clock3,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Subject } from "../types";
import { examCountdown, formatExamDate, formatExamTime, parseSubjectMeta } from "../utils";

interface TimetablePageProps {
  subjects: Subject[];
  openExam: (subject: Subject) => void;
}

export const TimetablePage: React.FC<TimetablePageProps> = ({
  subjects,
  openExam,
}) => {
  // Sort subjects: active upcoming first (by date), then completed, then unset
  const sortedSubjects = [...subjects].sort((a, b) => {
    const rank = (s: Subject) => {
      if (!s.exam?.exam_date) return 2;
      const count = examCountdown(s.exam);
      if (count.label === "Exam Completed") return 1;
      return 0;
    };
    return (
      rank(a) - rank(b) ||
      (a.exam?.exam_date ?? "9999").localeCompare(b.exam?.exam_date ?? "9999")
    );
  });

  const nearestActiveId = sortedSubjects.find(
    (s) =>
      s.exam?.exam_date &&
      examCountdown(s.exam).label !== "Exam Completed"
  )?.id;

  return (
    <div className="space-y-8 animate-rise-in select-none text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/15 px-3.5 py-1 text-[11px] font-bold text-[#A78BFA] tracking-wider uppercase mb-3 shadow-sm">
            <CalendarDays size={12} strokeWidth={2.4} />
            Countdown Engine
          </div>
          <h1 className="font-display text-[28px] md:text-[34px] font-extrabold tracking-tight text-white">
            Exam Timetable
          </h1>
          <p className="mt-1 text-[14px] text-white/50">
            Keep your deadlines in clear focus. Set exam dates and track live countdowns.
          </p>
        </div>

        {/* IST Info Pill */}
        <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-2 text-[11px] font-medium text-white/60">
          <Clock3 size={13} className="text-[#10B96F]" />
          <span>Calculated in IST (Asia/Kolkata)</span>
        </div>
      </div>

      {/* Timetable List Cards */}
      <div className="space-y-4">
        {sortedSubjects.map((subject) => {
          const meta = parseSubjectMeta(subject.subject_name);
          const countdown = examCountdown(subject.exam);
          const isNearest = subject.id === nearestActiveId;
          const hasDate = Boolean(subject.exam?.exam_date);

          return (
            <div
              key={subject.id}
              className={`glass-card relative overflow-hidden rounded-3xl p-5 md:p-6 transition-all duration-300 ${
                isNearest
                  ? "border-[#10B96F]/50 shadow-emerald-glow bg-white/[0.06]"
                  : "border-white/10"
              }`}
            >
              {/* Highlight ribbon for nearest exam */}
              {isNearest && (
                <div className="absolute top-0 right-0 bg-[#10B96F] text-black text-[9px] font-extrabold uppercase tracking-widest px-4 py-0.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                  <Sparkles size={10} />
                  Nearest Exam
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                {/* Left: Code badge & Subject details */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display font-extrabold text-[14px] shadow-sm transition ${
                      isNearest
                        ? "bg-[#10B96F] text-black shadow-emerald-glow"
                        : "btn-float text-white"
                    }`}
                  >
                    {meta.code}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-[17px] font-bold text-white truncate">
                        {meta.displayName}
                      </h2>
                      <span className="text-[11px] font-medium text-white/40">
                        {meta.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-[13px] text-white/60">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-[#10B96F]" />
                        <span>{formatExamDate(subject.exam?.exam_date ?? null)}</span>
                      </span>
                      {subject.exam?.exam_time && (
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={14} className="text-[#10B96F]" />
                          <span>{formatExamTime(subject.exam.exam_time)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Countdown pill & Edit button */}
                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold shadow-sm ${
                      countdown.tone === "urgent"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                        : countdown.tone === "soon"
                        ? "bg-[#10B96F]/20 text-[#34D399] border border-[#10B96F]/40"
                        : "bg-white/[0.06] text-white/70 border border-white/10"
                    }`}
                  >
                    {countdown.label}
                  </span>

                  <button
                    onClick={() => openExam(subject)}
                    className="btn-float flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold text-white/80 hover:text-white"
                  >
                    <Pencil size={13} />
                    <span>{hasDate ? "Edit" : "Set Date"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
