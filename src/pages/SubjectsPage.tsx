import React from "react";
import { BookOpen } from "lucide-react";
import { Subject } from "../types";
import { SubjectCard } from "../components/SubjectCard";
import { ProgressBar } from "../components/ProgressBar";

interface SubjectsPageProps {
  subjects: Subject[];
  toggleUnit: (subjectId: string, unitId: string, completed: boolean) => void;
  resetSubject: (subject: Subject) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  subjects,
  toggleUnit,
  resetSubject,
}) => {
  const totalUnits = subjects.reduce((sum, s) => sum + s.total_units, 0);
  const completedUnits = subjects.reduce(
    (sum, s) => sum + s.units.filter((u) => u.is_completed).length,
    0
  );
  const overallPercentage = totalUnits
    ? Math.round((completedUnits / totalUnits) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-rise-in select-none text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1 text-[11px] font-bold text-[#16C784] tracking-wider uppercase mb-3">
            <BookOpen size={12} strokeWidth={2.4} />
            Semester Syllabus
          </div>
          <h1 className="font-display text-[28px] md:text-[34px] font-extrabold tracking-tight text-white">
            My Subjects
          </h1>
          <p className="mt-1 text-[14px] text-white/50">
            Track your mastery across all 5 engineering courses. Check off units as you finish studying.
          </p>
        </div>

        {/* Global Units Progress Pill Card */}
        <div className="glass-card flex items-center gap-4 px-5 py-3 rounded-2xl border border-white/10">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">
              Syllabus Coverage
            </div>
            <div className="font-display text-[15px] font-extrabold text-white">
              {completedUnits} of {totalUnits} Units
            </div>
          </div>
          <div className="w-24">
            <ProgressBar value={overallPercentage} size="sm" />
            <div className="text-right text-[10px] font-extrabold text-[#16C784] mt-0.5">
              {overallPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync Status Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/10 px-5 py-3 text-[12px] text-white/60">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#16C784]" />
          <span>All updates save automatically to your cloud database account in real-time.</span>
        </div>
        <span className="text-[11px] font-bold text-[#16C784] font-mono">Auto-saving</span>
      </div>

      {/* Grid of 5 Redesigned Subject Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            toggleUnit={toggleUnit}
            onReset={() => resetSubject(subject)}
            compact={false}
          />
        ))}
      </div>
    </div>
  );
};
