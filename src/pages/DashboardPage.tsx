import React from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Pencil,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Page, Subject } from "../types";
import { examCountdown, formatExamDate, formatExamTime, getGreeting, parseSubjectMeta } from "../utils";
import { StatCard } from "../components/StatCard";
import { SubjectCard } from "../components/SubjectCard";
import { ProgressBar } from "../components/ProgressBar";

interface DashboardPageProps {
  subjects: Subject[];
  totalUnits: number;
  completedUnits: number;
  remainingUnits: number;
  progress: number;
  quote: string;
  userName?: string;
  toggleUnit: (subjectId: string, unitId: string, completed: boolean) => void;
  setPage: (page: Page) => void;
  openExam: (subject: Subject) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  subjects,
  totalUnits,
  completedUnits,
  remainingUnits,
  progress,
  quote,
  userName = "Student",
  toggleUnit,
  setPage,
  openExam,
}) => {
  const { greeting, subtitle } = getGreeting(userName);

  const nearestExamSubject = [...subjects]
    .filter(
      (s) =>
        s.exam?.exam_date &&
        examCountdown(s.exam).label !== "Exam Completed"
    )
    .sort((a, b) => a.exam!.exam_date!.localeCompare(b.exam!.exam_date!))[0];

  const nearestCountdown = nearestExamSubject ? examCountdown(nearestExamSubject.exam) : null;
  const nearestMeta = nearestExamSubject ? parseSubjectMeta(nearestExamSubject.subject_name) : null;

  return (
    <div className="space-y-7 animate-rise-in text-white">
      <div className="glass-card relative overflow-hidden p-6 md:p-8">
        <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-[#16C784]/[0.035] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1 text-[11px] font-bold text-[#16C784] tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16C784]"></span>
              </span>
              Academic Semester OS
            </div>

            <h1 className="font-display text-[30px] md:text-[38px] font-extrabold tracking-tight text-white leading-tight">
              {greeting}
            </h1>

            <p className="text-[14px] md:text-[15px] text-[#A0A8B4] font-medium max-w-xl">
              {subtitle}
            </p>
          </div>

          {/* Quick Target CGPA Pill */}
          <div className="flex items-center gap-3">
            <div className="glass-subtle flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16C784]/10 text-[#16C784] border border-[#16C784]/20">
                <Target size={20} strokeWidth={2.4} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#A0A8B4]">
                  Target CGPA
                </div>
                <div className="font-display text-[17px] font-black text-[#16C784]">
                  9.0+ / 10.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 100% Completion Celebration Banner ─── */}
      {completedUnits === totalUnits && totalUnits > 0 && (
        <div className="glass-card flex items-center gap-4 border border-[#16C784]/25 p-5 text-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#16C784] text-[#080A0E]">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="font-display text-[16px] font-bold">
              Outstanding work! All {totalUnits} syllabus units completed! 🎉
            </div>
            <div className="text-[12px] text-white/60 mt-0.5">
              You are thoroughly prepared for your end-semester examinations. Stay confident and focused.
            </div>
          </div>
        </div>
      )}

      {/* Five live semester statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          label="Total Courses"
          value={subjects.length}
          detail="Courses tracked"
          icon={BookOpen}
        />
        <StatCard
          label="Total Units"
          value={totalUnits}
          detail="Across all courses"
          icon={GraduationCap}
        />
        <StatCard
          label="Completed Units"
          value={completedUnits}
          detail={`${progress}% complete`}
          icon={CheckCircle2}
          trend={completedUnits > 0 ? "up" : "neutral"}
          highlight={true}
        />
        <StatCard
          label="Pending Units"
          value={remainingUnits}
          detail="Left to study"
          icon={Target}
        />
        {/* Overall Syllabus Progress Card */}
        <div className="glass-card col-span-2 sm:col-span-1 p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#A0A8B4]">
              Overall Progress
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#16C784]/10 text-[#16C784] border border-[#16C784]/20">
              <TrendingUp size={16} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-display text-[26px] md:text-[30px] font-extrabold text-[#16C784] tracking-tight">
                {progress}%
              </span>
              <span className="text-[11px] font-semibold text-white/50 font-mono">
                {completedUnits}/{totalUnits}
              </span>
            </div>
            <ProgressBar value={progress} size="sm" />
          </div>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        {/* Left Column: Subject Syllabus Tracker */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-display text-[18px] font-bold text-white tracking-tight">
                Syllabus Mastery Tracker
              </h2>
              <p className="text-[13px] text-[#A0A8B4]">
                Mark each unit as you study; your progress saves automatically.
              </p>
            </div>

            <button
              onClick={() => setPage("My Subjects")}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-bold text-[#16C784] hover:text-white transition"
            >
              <span>View All Courses</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="space-y-4">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                toggleUnit={toggleUnit}
                compact={true}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Upcoming Examination & Mindset Quote */}
        <div className="space-y-6">
          {/* Next Examination Card */}
          <div className="glass-card relative overflow-hidden p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16C784]/10 text-[#16C784] border border-[#16C784]/20">
                  <CalendarDays size={15} />
                </span>
                <h3 className="font-display text-[15px] font-bold text-white">
                  Next Examination
                </h3>
              </div>

              <button
                onClick={() => setPage("Exam Timetable")}
                className="text-[11px] font-bold text-[#16C784] hover:underline"
              >
                All Exams
              </button>
            </div>

            {nearestExamSubject && nearestCountdown ? (
              <div className="rounded-2xl bg-[#171C24] border border-white/10 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#16C784]">
                      {nearestMeta?.code} • {nearestMeta?.category}
                    </span>
                    <h4 className="font-display text-[18px] font-extrabold text-white mt-0.5">
                      {nearestMeta?.displayName}
                    </h4>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm ${
                      nearestCountdown.tone === "urgent"
                        ? "bg-[#16C784]/10 text-[#16C784] border border-[#16C784]/25"
                        : nearestCountdown.tone === "soon"
                        ? "bg-[#16C784]/10 text-[#16C784] border border-[#16C784]/25"
                        : "bg-white/[0.08] text-white/80 border border-white/10"
                    }`}
                  >
                    {nearestCountdown.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-white/80">
                    <CalendarDays size={14} className="text-[#16C784]" />
                    <span>{formatExamDate(nearestExamSubject.exam?.exam_date ?? null)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-white/80">
                    <Clock3 size={14} className="text-[#16C784]" />
                    <span>{formatExamTime(nearestExamSubject.exam?.exam_time ?? null)}</span>
                  </div>
                </div>

                <button
                  onClick={() => openExam(nearestExamSubject)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 py-2.5 text-[12px] font-bold text-white transition shadow-sm"
                >
                  <Pencil size={13} />
                  <span>Update Exam Schedule</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-6 text-center">
                <CalendarDays size={24} className="mx-auto text-white/40 mb-2" />
                <div className="font-display text-[14px] font-bold text-white">
                  No upcoming exams scheduled
                </div>
                <p className="text-[12px] text-white/50 mt-1">
                  Add dates to activate the live IST countdown timer.
                </p>
                <button
                  onClick={() => {
                    const firstSubject = subjects[0];
                    if (firstSubject) openExam(firstSubject);
                    else setPage("Exam Timetable");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16C784] text-[#080A0E] text-[12px] font-bold hover:opacity-90 transition"
                >
                  Schedule an Exam
                </button>
              </div>
            )}
          </div>

          {/* Daily Mindset & Focus Quote Card */}
          <div className="glass-card relative overflow-hidden p-5 md:p-6">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#16C784] mb-3">
              <Quote size={14} strokeWidth={2.5} />
              Keep Going
            </div>

            <p className="font-display text-[16px] md:text-[17px] font-semibold leading-relaxed text-white">
              “{quote}”
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#A0A8B4]">Consistency over intensity</span>
              <button
                onClick={() => setPage("My Subjects")}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#16C784] hover:text-white transition"
              >
                <BookOpen size={13} />
                Study Smart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
