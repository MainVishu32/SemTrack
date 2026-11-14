import React from "react";
import { CalendarDays, ChevronRight, Menu, Moon, Sun, Target } from "lucide-react";
import { Page } from "../types";

interface HeaderProps {
  page: Page;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  setMobileNav: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  page,
  darkMode,
  setDarkMode,
  setMobileNav,
}) => {
  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between px-5 md:px-8
      bg-[#050507]/80 backdrop-blur-2xl border-b border-white/10 text-white">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileNav(true)}
          aria-label="Open navigation"
          className="btn-float h-9 w-9 flex items-center justify-center rounded-xl lg:hidden text-white/70"
        >
          <Menu size={17} />
        </button>
        <div className="flex items-center gap-2 text-[14px]">
          <span className="hidden sm:inline text-white/40 font-mono text-[12px] tracking-wider">
            SEMTRACK
          </span>
          <ChevronRight size={13} className="hidden sm:inline text-white/20" />
          <h1 className="font-display font-semibold text-white tracking-tight">{page}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Semester Goal Chip */}
        <div className="hidden md:flex chip-glow items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold">
          <Target size={13} />
          <span className="font-mono">9.0+ CGPA</span>
        </div>

        {/* Date Chip */}
        <div className="hidden sm:flex btn-float items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] text-white/70">
          <CalendarDays size={13} className="text-[#10B96F]" />
          <span className="font-mono text-[11px]">{todayFormatted}</span>
        </div>

        {/* Theme / Ambient Glow Switch */}
        <button
          onClick={() => setDarkMode((v) => !v)}
          title="Toggle ambient lighting"
          aria-label="Toggle ambient lighting"
          className="btn-float h-9 w-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white"
        >
          {darkMode ? (
            <Sun size={15} className="text-[#34D399]" />
          ) : (
            <Moon size={15} className="text-[#A78BFA]" />
          )}
        </button>
      </div>
    </header>
  );
};
