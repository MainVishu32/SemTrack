import React, { useState } from "react";
import { Check } from "lucide-react";
import { Unit } from "../types";

interface UnitCheckboxProps {
  unit: Unit;
  subjectName: string;
  onToggle: (completed: boolean) => void;
}

export const UnitCheckbox: React.FC<UnitCheckboxProps> = ({
  unit,
  subjectName,
  onToggle,
}) => {
  const [pop, setPop] = useState(false);

  const handleClick = () => {
    setPop(true);
    setTimeout(() => setPop(false), 250);
    onToggle(unit.is_completed);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${subjectName} unit ${unit.unit_number}, ${
        unit.is_completed ? "completed" : "pending"
      }`}
      aria-pressed={unit.is_completed}
      className={`group flex items-center gap-2.5 h-10 px-3.5 rounded-2xl text-[13px] font-medium 
        transition-all duration-200 select-none active:scale-[0.96] ${
          unit.is_completed
            ? "bg-gradient-to-r from-[#10B96F] to-[#059669] text-white border border-[#34D399]/40 shadow-emerald-glow"
            : "btn-float text-white/70 hover:text-white"
        }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border transition-all ${
          unit.is_completed
            ? "border-white/50 bg-white/20 text-white shadow-sm"
            : "border-white/20 bg-transparent group-hover:border-[#10B96F]"
        } ${pop ? "scale-125" : "scale-100"}`}
      >
        {unit.is_completed && <Check size={11} strokeWidth={3} className="animate-check-pop" />}
      </span>
      <span className="font-mono text-[12px]">Unit {unit.unit_number}</span>
    </button>
  );
};
