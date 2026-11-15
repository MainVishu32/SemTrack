import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  highlight = false,
}) => (
  <div
    className={`glass-card rounded-3xl p-5 md:p-6 group relative overflow-hidden transition-all select-none ${
      highlight ? "border-[#16C784]/25" : "border-white/10"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-semibold text-white/50">{label}</span>
      <div
        className="h-8 w-8 flex items-center justify-center rounded-xl border border-[#16C784]/20 bg-[#16C784]/10"
      >
        <Icon size={15} className="text-[#16C784]" />
      </div>
    </div>

    <div className="mt-4 flex items-baseline justify-between gap-2">
      <span
        className={`font-display text-[28px] md:text-[32px] font-bold tracking-tight text-white ${
          highlight ? "text-[#16C784]" : ""
        }`}
      >
        {value}
      </span>
      <span
        className={`flex items-center gap-0.5 text-[11px] font-semibold font-mono ${
          trend === "up"
            ? "text-[#16C784]"
            : trend === "down"
            ? "text-white/60"
            : "text-white/40"
        }`}
      >
        {trend === "up" && <ArrowUpRight size={13} />}
        {trend === "down" && <ArrowDownRight size={13} />}
        {detail}
      </span>
    </div>
  </div>
);
