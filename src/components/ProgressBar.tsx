import React from "react";

interface ProgressBarProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = "md",
  showLabel = false,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const h = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" }[size];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-[12px] font-semibold mb-1.5">
          <span className="text-white/50">Progress</span>
          <span className="font-mono text-[#34D399]">{clamped}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-white/[0.08] border border-white/5 ${h}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#10B96F] via-[#34D399] to-[#A78BFA] transition-all duration-500 ease-out shadow-[0_0_14px_rgba(16,185,111,0.45)]"
          style={{ width: `${clamped > 0 ? Math.max(clamped, 2) : 0}%` }}
        />
      </div>
    </div>
  );
};
