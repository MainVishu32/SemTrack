import React, { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Clock3, X } from "lucide-react";
import { Subject } from "../types";
import { parseSubjectMeta } from "../utils";

interface ExamModalProps {
  subject: Subject;
  busy: boolean;
  onClose: () => void;
  onSave: (s: Subject, d: string, t: string) => void;
}

export const ExamModal: React.FC<ExamModalProps> = ({
  subject,
  busy,
  onClose,
  onSave,
}) => {
  const meta = parseSubjectMeta(subject.subject_name);
  const [date, setDate] = useState(subject.exam?.exam_date ?? "");
  const [time, setTime] = useState(subject.exam?.exam_time?.slice(0, 5) ?? "");

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(subject, date, time);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-rise-in text-white"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-modal-title"
        className="glass-deep w-full max-w-[480px] rounded-[28px] p-7 md:p-8 border border-white/15 shadow-smoked-deep"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="chip-glow inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold">
                <CalendarDays size={11} /> Schedule
              </span>
              <span className="text-[11px] text-white/50 font-mono">{meta.code}</span>
            </div>
            <h2 id="exam-modal-title" className="font-display text-[22px] font-bold text-white">
              {meta.displayName}
            </h2>
            <p className="mt-1 text-[13px] text-white/50">
              Set date & time in IST (Asia/Kolkata).
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-float h-9 w-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
              Examination date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input w-full text-white"
            />
            <p className="mt-1.5 text-[11px] text-white/40">
              Leave empty to remove this exam from timetable.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
              Examination time <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!date}
              className="glass-input w-full text-white disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          <div className="glass-subtle flex items-center gap-2 rounded-2xl p-3 text-[12px] text-white/60">
            <Clock3 size={14} className="text-[#10B96F] shrink-0" />
            Countdowns auto-calculate in IST (Asia/Kolkata).
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="btn-float rounded-2xl h-10 px-5 text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-emerald rounded-2xl h-10 px-5 text-[13px] font-bold disabled:opacity-60 shadow-emerald-glow"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
