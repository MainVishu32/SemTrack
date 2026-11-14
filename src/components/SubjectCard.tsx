import React from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Subject } from "../types";
import { parseSubjectMeta } from "../utils";
import { UnitCheckbox } from "./UnitCheckbox";
import { ProgressBar } from "./ProgressBar";

interface SubjectCardProps {
  subject: Subject;
  toggleUnit: (sid: string, uid: string, c: boolean) => void;
  onReset?: () => void;
  compact?: boolean;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  toggleUnit,
  onReset,
  compact = false,
}) => {
  const meta = parseSubjectMeta(subject.subject_name);
  const done = subject.units.filter((u) => u.is_completed).length;
  const pct = subject.total_units ? Math.round((done / subject.total_units) * 100) : 0;
  const allDone = done === subject.total_units && subject.total_units > 0;

  return (
    <div
      className={`glass-card rounded-3xl transition-all relative overflow-hidden ${
        allDone
          ? "border-[#10B96F]/50 shadow-emerald-glow bg-white/[0.06]"
          : "border-white/10"
      } ${compact ? "p-5" : "p-6"}`}
    >
      {/* Delicate ambient corner gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.015] rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Code chip */}
          <div className="btn-float flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-mono font-bold text-[13px] text-white">
            {meta.code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[16px] font-bold text-white tracking-tight">
                {meta.displayName}
              </h2>
              {allDone && (
                <span className="chip-glow inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold">
                  <CheckCircle2 size={10} /> complete
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[12px] text-white/50">
              <span>{meta.category}</span>
              <span>·</span>
              <span className="font-mono font-semibold text-[#10B96F]">
                {done}/{subject.total_units} units
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[16px] font-bold text-[#10B96F]">{pct}%</span>
          {onReset && (
            <button
              onClick={onReset}
              title="Reset progress"
              aria-label="Reset progress"
              className="btn-float h-8 w-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <ProgressBar value={pct} size="sm" />
      </div>

      <div className="flex flex-wrap gap-2">
        {subject.units.map((u) => (
          <UnitCheckbox
            key={u.id}
            unit={u}
            subjectName={meta.displayName}
            onToggle={(c) => toggleUnit(subject.id, u.id, c)}
          />
        ))}
      </div>
    </div>
  );
};
