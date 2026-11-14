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
      highlight ? "border-[#10B96F]/40 shadow-emerald-glow" : "border-white/10"
    }`}
  >
    {/* Ambient specular corner highlight */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-[#A78BFA]/[0.06] transition" />

    <div className="flex items-center justify-between">
      <span className="text-[12px] font-semibold text-white/50">{label}</span>
      <div
        className={`btn-float h-8 w-8 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
          highlight ? "!bg-[#10B96F]/15 !border-[#10B96F]/30" : ""
        }`}
      >
        <Icon size={15} className={highlight ? "text-[#10B96F]" : "text-white/60"} />
      </div>
    </div>

    <div className="mt-4 flex items-baseline justify-between gap-2">
      <span
        className={`font-display text-[28px] md:text-[32px] font-bold tracking-tight text-white ${
          highlight ? "text-[#34D399]" : ""
        }`}
      >
        {value}
      </span>
      <span
        className={`flex items-center gap-0.5 text-[11px] font-semibold font-mono ${
          trend === "up"
            ? "text-[#10B96F]"
            : trend === "down"
            ? "text-red-400"
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
