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
            ? "bg-[#16C784] text-[#080A0E] border border-[#16C784]"
            : "border border-white/10 bg-[#171C24] text-[#A0A8B4] hover:border-white/20 hover:text-[#F5F6F8]"
        }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border transition-all ${
          unit.is_completed
            ? "border-[#080A0E]/20 bg-[#080A0E]/10 text-[#080A0E]"
            : "border-white/25 bg-[#11151C] group-hover:border-[#16C784]"
        } ${pop ? "scale-125" : "scale-100"}`}
      >
        {unit.is_completed && <Check size={11} strokeWidth={3} className="animate-check-pop" />}
      </span>
      <span className="font-mono text-[12px]">Unit {unit.unit_number}</span>
    </button>
  );
};
