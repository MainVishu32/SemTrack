import React from "react";
import { GraduationCap } from "lucide-react";

interface LoadingScreenProps {
  label: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ label }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8DDC9] dark:bg-[#171717] p-6 transition-colors">
      <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl p-8 border border-white/70 dark:border-white/10 shadow-[0_20px_50px_rgba(36,33,30,0.06)] animate-rise-in max-w-sm w-full text-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#222222] text-[#D97736] shadow-md border border-[#D97736]/40">
          <GraduationCap size={28} />
          {/* Animated Spinner Ring */}
          <span className="absolute -inset-1.5 rounded-2xl border-2 border-transparent border-t-[#D97736] animate-spin" />
        </div>

        <div>
          <div className="font-display text-[16px] font-bold text-[#24211E] dark:text-[#F4EBDD]">
            SEMTRACK
          </div>
          <p className="mt-1 text-[13px] text-[#777067] dark:text-[#A39B8F] font-medium">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};
