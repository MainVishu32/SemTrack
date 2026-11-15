import React from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sliders,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Page } from "../types";

interface SidebarProps {
  page: Page;
  setPage: (page: Page) => void;
  overallProgress: number;
  userEmail: string;
  onSignOut: () => void;
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
}

const navItems: { name: Page; label: string; icon: React.ElementType }[] = [
  { name: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "My Subjects", label: "My Subjects", icon: BookOpen },
  { name: "Exam Timetable", label: "Timetable", icon: CalendarDays },
  { name: "Analytics", label: "Analytics", icon: TrendingUp },
  { name: "Settings", label: "Settings", icon: Sliders },
];

export const Sidebar: React.FC<SidebarProps> = ({
  page,
  setPage,
  overallProgress,
  userEmail,
  onSignOut,
  mobileNav,
  setMobileNav,
}) => {
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "S";

  return (
    <>
      {mobileNav && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setMobileNav(false);
          }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col justify-between overflow-y-auto
        glass-deep lg:rounded-r-3xl m-2 lg:m-0
        px-5 py-6 transition-transform duration-300 ease-out border-r border-white/10
        lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          {/* ─── Logo & Academic Brand ─── */}
          <div className="flex items-center justify-between px-1 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16C784] text-[#080A0E]">
                <GraduationCap size={20} strokeWidth={2.2} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#080A0E] bg-[#16C784]" />
              </div>
              <div>
                <div className="font-display font-extrabold text-[16px] tracking-tight text-white">
                  SEMTRACK
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <Zap size={10} className="text-[#16C784]" />
                  <span className="font-mono">Academic OS</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileNav(false)}
              aria-label="Close drawer"
              className="btn-float h-8 w-8 flex items-center justify-center rounded-xl lg:hidden"
            >
              <X size={16} />
            </button>
          </div>

          {/* ─── Nav Items ─── */}
          <nav className="space-y-1.5">
            {navItems.map(({ name, label, icon: Icon }) => {
              const active = page === name;
              return (
                <button
                  key={name}
                  onClick={() => {
                    setPage(name);
                    setMobileNav(false);
                  }}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-all duration-200 select-none ${
                    active
                      ? "bg-[#16C784]/10 text-white font-semibold border border-[#16C784]/20"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={active ? "text-[#16C784]" : "text-white/45 transition"}
                  />
                  <span>{label}</span>
                  {active ? (
                    <>
                      <span className="absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r-full bg-[#16C784]" />
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#16C784]" />
                    </>
                  ) : (
                    <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-40 transition" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ─── Bottom Status & Profile ─── */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {/* Target Progress Card */}
          <div className="glass-subtle rounded-2xl p-4">
            <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-white/80">
                <Target size={13} className="text-[#16C784]" />
                Semester Target
              </span>
              <span className="font-mono text-[#16C784]">9+ CGPA</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#29313C] mt-2">
              <div
                className="h-full rounded-full bg-[#16C784] transition-all duration-500"
                style={{ width: `${Math.max(overallProgress, 2)}%` }}
              />
            </div>
            <div className="text-right font-mono text-[11px] text-[#16C784] mt-1.5 font-semibold">
              {overallProgress}% syllabus
            </div>
          </div>

          {/* User Account Bar */}
          <div className="glass-subtle rounded-2xl p-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16C784] text-[#080A0E] font-mono text-[13px] font-bold">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-white">
                {userEmail || "Student"}
              </div>
              <div className="font-mono text-[10px] text-white/40 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16C784]" />
                Cloud Synced
              </div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="btn-float h-8 w-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
