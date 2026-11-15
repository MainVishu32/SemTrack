import React from "react";
import { GraduationCap } from "lucide-react";

interface LoadingScreenProps {
  label: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ label }) => {
  return (
    <div className="facet-canvas min-h-screen flex items-center justify-center p-6">
      <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl p-8 animate-rise-in max-w-sm w-full text-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16C784]/10 text-[#16C784] border border-[#16C784]/20">
          <GraduationCap size={28} />
          {/* Animated Spinner Ring */}
          <span className="absolute -inset-1.5 rounded-2xl border-2 border-transparent border-t-[#16C784] animate-spin" />
        </div>

        <div>
          <div className="font-display text-[16px] font-bold text-[#F5F6F8]">
            SEMTRACK
          </div>
          <p className="mt-1 text-[13px] text-[#A0A8B4] font-medium">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};
