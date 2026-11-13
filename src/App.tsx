import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";
import {
  ArrowDownRight, ArrowUpRight, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronRight, CircleHelp, Clock3, Cloud, GraduationCap, LayoutDashboard,
  LogOut, Menu, Moon, MoreHorizontal, Pencil, Quote, RotateCcw, Sun,
  Target, TrendingUp, X,
} from "lucide-react";

type Unit = { id: string; unit_number: number; is_completed: boolean; completed_at: string | null };
type Exam = { id: string; exam_date: string | null; exam_time: string | null };
type Subject = {
  id: string;
  subject_name: string;
  total_units: number;
  units: Unit[];
  exam: Exam | null;
};
type Page = "Dashboard" | "My Subjects" | "Exam Timetable" | "Analytics" | "Settings";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

const navigation: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "My Subjects", icon: BookOpen },
  { name: "Exam Timetable", icon: CalendarDays },
  { name: "Analytics", icon: TrendingUp },
  { name: "Settings", icon: MoreHorizontal },
];

const quotes = [
  "Small progress each day adds up to big results.",
  "You don't have to be perfect. Just keep showing up.",
  "The secret of getting ahead is getting started.",
  "Focus on the step in front of you, not the whole staircase.",
  "Discipline is choosing what you want most over what you want now.",
  "A little progress every day adds up to a lot over time.",
  "Your future is created by what you do today, not tomorrow.",
];

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function examCountdown(exam: Exam | null) {
  if (!exam?.exam_date) return { label: "Date not set", tone: "neutral" };
  const today = getTodayInIndia();
  const dayDifference = Math.round(
    (Date.parse(`${exam.exam_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  if (dayDifference < 0) return { label: "Exam Completed", tone: "muted" };
  if (dayDifference === 0) {
    if (exam.exam_time) {
      const now = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
      }).format(new Date());
      if (now >= exam.exam_time.slice(0, 5)) return { label: "Exam Completed", tone: "muted" };
    }
    return { label: "Today", tone: "urgent" };
  }
  if (dayDifference === 1) return { label: "Tomorrow", tone: "urgent" };
  return { label: `${dayDifference} Days Remaining`, tone: dayDifference <= 7 ? "soon" : "neutral" };
}

function formatExamDate(date: string | null) {
  if (!date) return "Choose a date";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
  }).format(new Date(`${date}T12:00:00+05:30`));
}

function shortName(name: string) {
  if (name.includes("(TOC)")) return "TOC";
  if (name.includes("(AI)")) return "Artificial Intelligence";
  if (name.includes("(CN)")) return "Computer Networks";
  return name;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [page, setPage] = useState<Page>("Dashboard");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("semtrack-theme") === "dark");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [examEditor, setExamEditor] = useState<Subject | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase || !session) return;
    setDataReady(false);
    setError("");
    const { data: subjectRows, error: subjectsError } = await supabase
      .from("subjects").select("id, subject_name, total_units").order("subject_name");
    if (subjectsError) {
      setError(`Could not load your subjects: ${subjectsError.message}`);
      setDataReady(true);
      return;
    }
    const ids = (subjectRows ?? []).map((subject) => subject.id as string);
    if (ids.length === 0) {
      setSubjects([]);
      setDataReady(true);
      return;
    }
    const [unitsResult, examsResult] = await Promise.all([
      supabase.from("units").select("id, subject_id, unit_number, is_completed, completed_at").in("subject_id", ids).order("unit_number"),
      supabase.from("exams").select("id, subject_id, exam_date, exam_time").in("subject_id", ids),
    ]);
    if (unitsResult.error || examsResult.error) {
      setError(`Could not load your study data: ${(unitsResult.error ?? examsResult.error)?.message ?? "Unknown database error"}`);
      setDataReady(true);
      return;
    }
    setSubjects((subjectRows ?? []).map((row) => {
      const exam = (examsResult.data ?? []).find((item) => item.subject_id === row.id);
      return {
        id: row.id as string,
        subject_name: row.subject_name as string,
        total_units: row.total_units as number,
        units: (unitsResult.data ?? [])
          .filter((unit) => unit.subject_id === row.id)
          .map((unit) => ({
            id: unit.id as string,
            unit_number: unit.unit_number as number,
            is_completed: unit.is_completed as boolean,
            completed_at: unit.completed_at as string | null,
          })),
        exam: exam
          ? { id: exam.id as string, exam_date: exam.exam_date as string | null, exam_time: exam.exam_time as string | null }
          : null,
      };
    }));
    setDataReady(true);
  }, [session]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(`Could not restore your session: ${sessionError.message}`);
      setSession(data.session);
      setAuthReady(true);
    }).catch((sessionError: unknown) => {
      if (!active) return;
      setError(`Could not restore your session: ${String(sessionError)}`);
      setSession(null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSubjects([]);
      setDataReady(false);
      setError("");
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (session) void loadData();
    else {
      setSubjects([]);
      setDataReady(true);
    }
  }, [session, loadData]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("semtrack-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const totalUnits = useMemo(() => subjects.reduce((total, subject) => total + subject.total_units, 0), [subjects]);
  const completedUnits = useMemo(() => subjects.reduce(
    (total, subject) => total + subject.units.filter((unit) => unit.is_completed).length, 0,
  ), [subjects]);
  const remainingUnits = totalUnits - completedUnits;
  const overallProgress = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const motivationalQuote = quotes[Math.floor(Date.now() / 86_400_000) % quotes.length];

  async function toggleUnit(subjectId: string, unitId: string, completed: boolean) {
    if (!supabase) return;
    const unit = subjects.find((subject) => subject.id === subjectId)?.units.find((item) => item.id === unitId);
    if (!unit) return;
    const nextCompleted = !completed;
    const completedAt = nextCompleted ? new Date().toISOString() : null;
    setSubjects((current) => current.map((subject) => subject.id === subjectId
      ? { ...subject, units: subject.units.map((item) => item.id === unitId
        ? { ...item, is_completed: nextCompleted, completed_at: completedAt } : item) }
      : subject));
    const { data: savedUnit, error: updateError } = await supabase.from("units")
      .update({ is_completed: nextCompleted, completed_at: completedAt }).eq("id", unitId).select("id").single();
    if (updateError || !savedUnit) {
      setSubjects((current) => current.map((subject) => subject.id === subjectId
        ? { ...subject, units: subject.units.map((item) => item.id === unitId
          ? { ...item, is_completed: completed, completed_at: unit.completed_at } : item) }
        : subject));
      setError(`Your progress was not saved: ${updateError?.message ?? "The unit could not be found in your account."}`);
      return;
    }
    const resultingSubject = subjects.find((subject) => subject.id === subjectId);
    const wasLastSubjectUnit = nextCompleted && resultingSubject
      && resultingSubject.units.filter((item) => item.is_completed).length + 1 === resultingSubject.total_units;
    const wasLastOverallUnit = nextCompleted && completedUnits + 1 === totalUnits;
    if (wasLastOverallUnit) notify("Incredible work — all 24 units are complete! 🎉");
    else if (wasLastSubjectUnit) notify(`Amazing — ${shortName(resultingSubject!.subject_name)} is complete! 🎉`);
    else notify(nextCompleted ? "Unit marked complete and saved." : "Unit marked as in progress.");
  }

  async function saveExam(subject: Subject, date: string, time: string) {
    if (!supabase || !subject.exam) return;
    setBusy(true);
    const { data: savedExam, error: updateError } = await supabase.from("exams").update({
      exam_date: date || null,
      exam_time: date ? (time || null) : null,
    }).eq("id", subject.exam.id).select("id").single();
    setBusy(false);
    if (updateError || !savedExam) {
      setError(`Your timetable change was not saved: ${updateError?.message ?? "The examination could not be found in your account."}`);
      return;
    }
    setSubjects((current) => current.map((item) => item.id === subject.id
      ? { ...item, exam: { ...subject.exam!, exam_date: date || null, exam_time: date ? (time || null) : null } }
      : item));
    setExamEditor(null);
    notify("Examination timetable updated.");
  }

  async function resetSubject(subject: Subject) {
    if (!supabase || !window.confirm(`Reset all ${subject.total_units} units in ${shortName(subject.subject_name)}? This cannot be undone.`)) return;
    const { data: resetUnits, error: resetError } = await supabase.from("units")
      .update({ is_completed: false, completed_at: null }).eq("subject_id", subject.id).select("id");
    if (resetError || resetUnits?.length !== subject.total_units) {
      setError(`Could not reset subject progress: ${resetError?.message ?? "Not all units in this subject could be updated."}`);
      return;
    }
    setSubjects((current) => current.map((item) => item.id === subject.id
      ? { ...item, units: item.units.map((unit) => ({ ...unit, is_completed: false, completed_at: null })) }
      : item));
    notify(`${shortName(subject.subject_name)} progress reset.`);
  }

  async function resetAll() {
    if (!supabase || !window.confirm("Reset progress for every subject? Your exam timetable will not change.")) return;
    const { data: resetUnits, error: resetError } = await supabase.from("units").update({ is_completed: false, completed_at: null })
      .in("subject_id", subjects.map((subject) => subject.id)).select("id");
    if (resetError || resetUnits?.length !== totalUnits) {
      setError(`Could not reset syllabus progress: ${resetError?.message ?? "Not all syllabus units could be updated."}`);
      return;
    }
    setSubjects((current) => current.map((subject) => ({
      ...subject, units: subject.units.map((unit) => ({ ...unit, is_completed: false, completed_at: null })),
    })));
    notify("All syllabus progress has been reset.");
  }

  if (!supabase) return <ConfigurationNotice />;
  if (!authReady) return <LoadingScreen label="Connecting securely…" />;
  if (!session) return <AuthScreen onError={setError} onClearError={() => setError("")} error={error} />;
  if (!dataReady) return <LoadingScreen label="Loading your semester…" />;

  return (
    <div className={`app-shell min-h-screen bg-[#f6f7f9] text-[#20232b] ${darkMode ? "dark" : ""}`}>
      {mobileNav && <button aria-label="Close navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />}
      <aside className={`sidebar surface fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#eceef1] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#272c3c] text-white"><GraduationCap size={19} /></div>
          <div><div className="font-[Manrope] text-[15px] font-extrabold tracking-[.08em]">SEMTRACK</div><div className="muted text-[11px]">My semester dashboard</div></div>
          <button onClick={() => setMobileNav(false)} className="muted ml-auto lg:hidden"><X size={18} /></button>
        </div>
        <div className="muted mb-2 mt-10 px-2 text-[10px] font-bold uppercase tracking-[.15em]">Workspace</div>
        <nav className="space-y-1">
          {navigation.map(({ name, icon: Icon }) => (
            <button key={name} onClick={() => { setPage(name); setMobileNav(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${page === name ? "bg-[#f0f2f5] font-semibold text-[#242938] dark:bg-[#252a34] dark:text-white" : "muted hover:bg-[#f7f8fa] dark:hover:bg-[#20242d]"}`}>
              <Icon size={17} strokeWidth={1.8} />{name}
              {name === "Dashboard" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#66a88b]" />}
            </button>
          ))}
        </nav>
        <div className="surface soft-bg mt-auto rounded-xl border border-[#eef0f3] p-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold"><Target size={15} className="text-[#668878]" /> Semester goal</div>
          <div className="muted mt-2 text-[11px]">Stay consistent. One unit at a time.</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e6e9ed] dark:bg-[#343946]"><div className="h-full rounded-full bg-[#779b88] transition-all" style={{ width: `${overallProgress}%` }} /></div>
          <div className="muted mt-1.5 text-right text-[10px]">{overallProgress}% complete</div>
        </div>
        <div className="line mt-4 flex items-center gap-3 border-t border-[#eef0f3] pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9edea] text-[12px] font-bold text-[#557362]">{session.user.email?.[0]?.toUpperCase() ?? "S"}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold">{session.user.email}</div><div className="muted text-[10px]">Personal account</div></div>
          <button title="Sign out" onClick={async () => { const { error: signOutError } = await supabase.auth.signOut(); if (signOutError) setError(`Could not sign out: ${signOutError.message}`); }} className="muted hover:text-[#31394a]"><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[248px]">
        <header className="line surface sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#eceef1] bg-white/90 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} aria-label="Open navigation" className="muted lg:hidden"><Menu size={19} /></button><div className="text-[13px] font-semibold">{page}</div><ChevronRight size={14} className="muted" /><div className="muted hidden text-[12px] sm:block">End-semester preparation</div></div>
          <div className="flex items-center gap-3"><span className="muted hidden text-[12px] sm:block">{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" }).format(new Date())}</span><button aria-label="Toggle dark mode" onClick={() => setDarkMode((value) => !value)} className="surface muted flex h-9 w-9 items-center justify-center rounded-lg border border-[#eceef1] hover:text-[#30384a]">{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button></div>
        </header>
        <div className="mx-auto max-w-[1250px] px-5 py-8 md:px-9 md:py-10">
          {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-[#edc8c2] bg-[#fff4f2] px-4 py-3 text-[12px] text-[#a1453d]"><CircleHelp size={16} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}><X size={15} /></button></div>}
          <div className="animate-rise" key={page}>
            {page === "Dashboard" && <DashboardPage subjects={subjects} totalUnits={totalUnits} completedUnits={completedUnits} remainingUnits={remainingUnits} progress={overallProgress} quote={motivationalQuote} toggleUnit={toggleUnit} setPage={setPage} openExam={setExamEditor} />}
            {page === "My Subjects" && <SubjectsPage subjects={subjects} toggleUnit={toggleUnit} resetSubject={resetSubject} />}
            {page === "Exam Timetable" && <TimetablePage subjects={subjects} openExam={setExamEditor} />}
            {page === "Analytics" && <AnalyticsPage subjects={subjects} totalUnits={totalUnits} completedUnits={completedUnits} progress={overallProgress} />}
            {page === "Settings" && <SettingsPage email={session.user.email ?? ""} darkMode={darkMode} setDarkMode={setDarkMode} resetAll={resetAll} />}
          </div>
        </div>
      </main>
      {toast && <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100%-2.5rem)] items-center gap-2 rounded-xl bg-[#262b36] px-4 py-3 text-[12px] font-medium text-white shadow-xl"><CheckCircle2 size={16} className="text-[#a5ccb2]" />{toast}</div>}
      {examEditor && <ExamModal subject={examEditor} busy={busy} onClose={() => setExamEditor(null)} onSave={saveExam} />}
    </div>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]"><div className="muted flex items-center gap-3 text-sm"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8ddd9] border-t-[#668878]" />{label}</div></div>;
}

function ConfigurationNotice() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] p-5"><div className="surface w-full max-w-lg rounded-2xl border border-[#eceef1] bg-white p-8 shadow-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf1ee] text-[#557362]"><Cloud size={20} /></div><h1 className="font-[Manrope] text-xl font-bold">Connect your Supabase project</h1><p className="muted mt-2 text-sm leading-6">Add your project URL and publishable anon key to a local <code>.env</code> file. Follow the setup guide in <code>README.md</code>.</p><pre className="soft-bg mt-5 overflow-auto rounded-xl bg-[#f5f6f7] p-4 text-xs leading-6">VITE_SUPABASE_URL=https://your-project.supabase.co{"\n"}VITE_SUPABASE_ANON_KEY=your-publishable-key</pre><p className="muted mt-4 text-xs">No service-role key belongs in this application.</p></div></div>;
}

function AuthScreen({ error, onError, onClearError }: { error: string; onError: (message: string) => void; onClearError: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage("");
    onClearError();
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (result.error) {
      onError(result.error.message);
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Check your inbox to confirm your email, then sign in here.");
    }
  }

  return <div className="flex min-h-screen bg-[#f6f7f9]">
    <div className="hidden w-[43%] flex-col justify-between bg-[#222834] p-12 text-white lg:flex">
      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><GraduationCap size={19} /></div><span className="font-[Manrope] text-sm font-extrabold tracking-[.1em]">SEMTRACK</span></div>
      <div className="max-w-md"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Target size={22} /></div><h1 className="font-[Manrope] text-[34px] font-bold leading-tight">A little progress, every day.</h1><p className="mt-4 text-[14px] leading-7 text-white/60">One calm place to track your subjects, make a plan, and feel ready for what comes next.</p></div>
      <div className="text-[11px] text-white/40">Your personal end-semester companion.</div>
    </div>
    <div className="flex flex-1 items-center justify-center p-5"><div className="w-full max-w-[390px]">
      <div className="mb-9 lg:hidden"><div className="font-[Manrope] text-sm font-extrabold tracking-[.1em]">SEMTRACK</div><div className="muted mt-1 text-xs">My semester dashboard</div></div>
      <div className="mb-7"><h2 className="font-[Manrope] text-[25px] font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h2><p className="muted mt-2 text-[13px]">{mode === "signin" ? "Sign in to pick up where you left off." : "Your progress will stay with you across devices."}</p></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-[12px] font-semibold">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#e1e4e9] bg-white px-3 text-[13px] outline-none focus:border-[#829c8c] focus:ring-2 focus:ring-[#829c8c]/15" placeholder="you@example.com" /></label>
        <label className="block text-[12px] font-semibold">Password<input required minLength={6} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#e1e4e9] bg-white px-3 text-[13px] outline-none focus:border-[#829c8c] focus:ring-2 focus:ring-[#829c8c]/15" placeholder="At least 6 characters" /></label>
        {error && <div role="alert" className="rounded-lg bg-[#fff0ee] px-3 py-2 text-[12px] text-[#a1453d]">{error}</div>}
        {message && <div role="status" className="rounded-lg bg-[#edf4ef] px-3 py-2 text-[12px] text-[#496b57]">{message}</div>}
        <button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#282e3a] text-[13px] font-semibold text-white transition hover:bg-[#394252] disabled:opacity-60">{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ChevronRight size={15} /></button>
      </form>
      <div className="muted mt-6 text-center text-[12px]">{mode === "signin" ? "New to SEMTRACK?" : "Already have an account?"}{" "}<button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); onClearError(); setMessage(""); }} className="font-semibold text-[#557362] hover:underline">{mode === "signin" ? "Create an account" : "Sign in"}</button></div>
      <div className="muted mt-9 flex items-center justify-center gap-1.5 text-[10px]"><Cloud size={12} />Your progress is securely saved to your cloud account</div>
    </div></div>
  </div>;
}

function ProgressBar({ value, color = "bg-[#789786]" }: { value: number; color?: string }) {
  return <div className="h-[6px] overflow-hidden rounded-full bg-[#edf0f2] dark:bg-[#303541]"><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} /></div>;
}

function StatCard({ label, value, detail, icon: Icon, change }: { label: string; value: string; detail: string; icon: typeof BookOpen; change?: "up" | "down" }) {
  return <div className="surface rounded-xl border border-[#e9ebef] bg-white p-4 md:p-5"><div className="flex items-center justify-between"><span className="muted text-[11px] font-medium">{label}</span><Icon size={16} className="muted" /></div><div className="mt-3 flex items-end justify-between"><span className="font-[Manrope] text-[25px] font-bold tracking-tight">{value}</span><span className={`flex items-center gap-0.5 text-[10px] ${change === "up" ? "text-[#5e8a70]" : change === "down" ? "text-[#b27a5c]" : "muted"}`}>{change === "up" ? <ArrowUpRight size={12} /> : change === "down" ? <ArrowDownRight size={12} /> : null}{detail}</span></div></div>;
}

function DashboardPage({ subjects, totalUnits, completedUnits, remainingUnits, progress, quote, toggleUnit, setPage, openExam }: {
  subjects: Subject[]; totalUnits: number; completedUnits: number; remainingUnits: number; progress: number; quote: string;
  toggleUnit: (subjectId: string, unitId: string, completed: boolean) => void; setPage: (page: Page) => void; openExam: (subject: Subject) => void;
}) {
  const exam = [...subjects]
    .filter((subject) => subject.exam?.exam_date && examCountdown(subject.exam).label !== "Exam Completed")
    .sort((a, b) => a.exam!.exam_date!.localeCompare(b.exam!.exam_date!))[0];
  return <div>
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eaf0ec] px-2.5 py-1 text-[10px] font-semibold text-[#587362]"><span className="h-1.5 w-1.5 rounded-full bg-[#6f9c7d]" />EXAM PREPARATION</div><h1 className="font-[Manrope] text-[27px] font-bold tracking-[-.04em] md:text-[31px]">Let’s achieve that 9+ CGPA!</h1><p className="muted mt-2 text-[13px]">A clear plan makes all the difference. Keep your momentum going.</p></div>
      <div className="muted flex items-center gap-2 text-[11px]"><CalendarDays size={14} />{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</div>
    </div>
    {completedUnits === totalUnits && totalUnits > 0 && <div className="mb-5 rounded-xl border border-[#cbded0] bg-[#f0f6f1] px-4 py-3 text-[12px] font-medium text-[#496b57] dark:bg-[#1d3025]">🎉 Every unit is complete. You’ve done something wonderful for your future self.</div>}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
      <StatCard label="Total subjects" value={String(subjects.length)} detail="This semester" icon={BookOpen} />
      <StatCard label="Total units" value={String(totalUnits)} detail="Across all subjects" icon={GraduationCap} />
      <StatCard label="Units completed" value={String(completedUnits)} detail="Great progress" icon={CheckCircle2} change={completedUnits ? "up" : undefined} />
      <StatCard label="Units remaining" value={String(remainingUnits)} detail="One at a time" icon={Target} />
      <div className="surface col-span-2 rounded-xl border border-[#e9ebef] bg-white p-4 md:col-span-1 md:p-5"><div className="flex items-center justify-between"><span className="muted text-[11px] font-medium">Syllabus progress</span><TrendingUp size={16} className="muted" /></div><div className="mt-3 flex items-end justify-between"><span className="font-[Manrope] text-[25px] font-bold">{progress}%</span><span className="muted text-[10px]">Overall</span></div><div className="mt-2"><ProgressBar value={progress} /></div></div>
    </div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <section className="surface rounded-xl border border-[#e9ebef] bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-[14px] font-bold">Subject progress</h2><p className="muted mt-1 text-[11px]">Your syllabus, one unit at a time</p></div><button onClick={() => setPage("My Subjects")} className="flex items-center gap-1 text-[11px] font-semibold text-[#587362]">All subjects <ChevronRight size={14} /></button></div>
        <div className="space-y-5">{subjects.map((subject) => <SubjectProgress key={subject.id} subject={subject} toggleUnit={toggleUnit} />)}</div>
      </section>
      <div className="space-y-5">
        <section className="surface rounded-xl border border-[#e9ebef] bg-white p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between"><div><h2 className="text-[14px] font-bold">Next examination</h2><p className="muted mt-1 text-[11px]">Your nearest scheduled exam</p></div><CalendarDays size={17} className="muted" /></div>
          {exam ? <ExamPreview subject={exam} openExam={openExam} /> : <EmptyExams onEdit={() => { const candidate = subjects.find((subject) => subject.exam); if (candidate) openExam(candidate); else setPage("Exam Timetable"); }} />}
          <button onClick={() => setPage("Exam Timetable")} className="muted mt-4 flex w-full items-center justify-between border-t border-[#eef0f3] pt-3 text-[11px] font-medium hover:text-[#30384a]">View full timetable <ChevronRight size={14} /></button>
        </section>
        <section className="rounded-xl bg-[#282e3a] p-5 text-white md:p-6"><div className="flex items-center gap-2 text-[11px] font-semibold text-white/70"><Quote size={14} />A thought for today</div><p className="mt-4 font-[Manrope] text-[16px] font-semibold leading-6">“{quote}”</p><p className="mt-3 text-[10px] text-white/45">Your daily reminder to keep going.</p></section>
      </div>
    </div>
  </div>;
}

function SubjectProgress({ subject, toggleUnit, onReset }: { subject: Subject; toggleUnit: (subjectId: string, unitId: string, completed: boolean) => void; onReset?: () => void }) {
  const completed = subject.units.filter((unit) => unit.is_completed).length;
  const progress = subject.total_units ? Math.round((completed / subject.total_units) * 100) : 0;
  return <div>
    <div className="mb-2.5 flex items-center justify-between gap-4"><div className="min-w-0"><div className="truncate text-[12px] font-semibold">{shortName(subject.subject_name)}</div><div className="muted mt-0.5 text-[10px]">{completed} of {subject.total_units} units completed</div></div><div className="flex items-center gap-3"><span className="text-[11px] font-semibold">{progress}%</span>{onReset && <button title="Reset subject progress" aria-label={`Reset ${shortName(subject.subject_name)} progress`} onClick={onReset} className="muted"><RotateCcw size={14} /></button>}</div></div>
    <ProgressBar value={progress} />
    <div className="mt-3 flex flex-wrap gap-1.5">{subject.units.map((unit) => <button key={unit.id} aria-label={`${shortName(subject.subject_name)} unit ${unit.unit_number}, ${unit.is_completed ? "completed" : "not completed"}`} aria-pressed={unit.is_completed} onClick={() => toggleUnit(subject.id, unit.id, unit.is_completed)} className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-[10px] transition ${unit.is_completed ? "border-[#d3e2d7] bg-[#edf4ef] text-[#4d7459] dark:border-[#32493a] dark:bg-[#233329] dark:text-[#a7c7ae]" : "unit-pending border-[#e9ebef] bg-[#fafbfc] text-[#626977] hover:border-[#cbd8cf] dark:text-[#c0c5d0]"}`}><span className={`flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border ${unit.is_completed ? "border-[#6f947a] bg-[#6f947a] text-white" : "border-[#cfd4da]"}`}>{unit.is_completed && <Check size={10} strokeWidth={3} />}</span>Unit {unit.unit_number}</button>)}</div>
  </div>;
}

function SubjectsPage({ subjects, toggleUnit, resetSubject }: { subjects: Subject[]; toggleUnit: (subjectId: string, unitId: string, completed: boolean) => void; resetSubject: (subject: Subject) => void }) {
  const total = subjects.reduce((sum, subject) => sum + subject.total_units, 0);
  const completed = subjects.reduce((sum, subject) => sum + subject.units.filter((unit) => unit.is_completed).length, 0);
  return <div><PageHeading eyebrow="YOUR SYLLABUS" title="My subjects" description="Keep your syllabus moving. Every checkbox saves directly to your account." /><div className="mb-5 flex items-center justify-between rounded-xl border border-[#e9ebef] bg-white px-5 py-4"><div><div className="text-[12px] font-semibold">{completed} of {total} units completed</div><div className="muted mt-1 text-[10px]">Progress is saved to your cloud account</div></div><div className="w-[36%] max-w-[180px]"><ProgressBar value={total ? completed / total * 100 : 0} /></div></div><div className="grid gap-4 xl:grid-cols-2">{subjects.map((subject, index) => <div key={subject.id} className="surface rounded-xl border border-[#e9ebef] bg-white p-5 md:p-6"><div className="mb-5 flex items-start justify-between"><div><div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3f1] text-[11px] font-bold text-[#607c6b]">{String(index + 1).padStart(2, "0")}</div><h2 className="text-[14px] font-bold">{shortName(subject.subject_name)}</h2><p className="muted mt-1 text-[11px]">{subject.total_units} syllabus units</p></div><button onClick={() => resetSubject(subject)} aria-label={`Reset ${shortName(subject.subject_name)} progress`} title="Reset subject progress" className="muted rounded-lg p-2 hover:bg-[#f5f6f7] hover:text-[#4c5664]"><RotateCcw size={15} /></button></div><SubjectProgress subject={subject} toggleUnit={toggleUnit} onReset={() => resetSubject(subject)} /></div>)}</div></div>;
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-7"><div className="mb-2 text-[10px] font-bold tracking-[.15em] text-[#65806f]">{eyebrow}</div><h1 className="font-[Manrope] text-[27px] font-bold tracking-[-.04em]">{title}</h1><p className="muted mt-2 text-[12px]">{description}</p></div>;
}

function EmptyExams({ onEdit }: { onEdit: () => void }) {
  return <div className="rounded-xl border border-dashed border-[#dfe3e7] px-4 py-5 text-center"><div className="muted mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f6f7]"><CalendarDays size={17} /></div><div className="text-[11px] font-semibold">No exams scheduled yet</div><div className="muted mt-1 text-[10px]">Add a date when you know it.</div><button onClick={onEdit} className="mt-3 text-[10px] font-semibold text-[#587362] hover:underline">Add examination date</button></div>;
}

function ExamPreview({ subject, openExam }: { subject: Subject; openExam: (subject: Subject) => void }) {
  const countdown = examCountdown(subject.exam);
  return <div className="rounded-xl bg-[#f6f8f6] p-4 dark:bg-[#202a24]"><div className="flex items-start justify-between"><div><div className="text-[13px] font-bold">{shortName(subject.subject_name)}</div><div className="muted mt-1.5 flex items-center gap-1.5 text-[10px]"><CalendarDays size={12} />{formatExamDate(subject.exam?.exam_date ?? null)}</div><div className="muted mt-1 flex items-center gap-1.5 text-[10px]"><Clock3 size={12} />{subject.exam?.exam_time ? subject.exam.exam_time.slice(0, 5) : "Time not set"}</div></div><span className="rounded-md bg-white px-2 py-1 text-[9px] font-semibold text-[#587362] shadow-sm dark:bg-[#303b34]">{countdown.label}</span></div><button onClick={() => openExam(subject)} className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#587362]"><Pencil size={12} />Edit exam</button></div>;
}

function TimetablePage({ subjects, openExam }: { subjects: Subject[]; openExam: (subject: Subject) => void }) {
  const sorted = [...subjects].sort((a, b) => {
    const rank = (subject: Subject) => !subject.exam?.exam_date
      ? 2 : examCountdown(subject.exam).label === "Exam Completed" ? 1 : 0;
    return rank(a) - rank(b)
      || (a.exam?.exam_date ?? "9999").localeCompare(b.exam?.exam_date ?? "9999");
  });
  const nearestId = sorted.find((subject) => subject.exam?.exam_date
    && examCountdown(subject.exam).label !== "Exam Completed")?.id;
  return <div><PageHeading eyebrow="PLAN AHEAD" title="Exam timetable" description="Add and update your examination dates and times whenever you need to." /><div className="mb-5 flex items-center gap-2 rounded-xl border border-[#e9ebef] bg-white px-4 py-3 text-[11px] text-[#5b6472]"><Clock3 size={15} className="text-[#668878]" />Dates and countdowns are calculated in Indian Standard Time (Asia/Kolkata).</div><div className="space-y-3">{sorted.map((subject) => {const countdown = examCountdown(subject.exam); return <div key={subject.id} className={`surface flex flex-col gap-4 rounded-xl border bg-white p-5 md:flex-row md:items-center ${subject.id === nearestId ? "border-[#d7e3da]" : "border-[#e9ebef]"}`}><div className="flex min-w-0 flex-1 items-center gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f3f4] text-[#66707c]"><BookOpen size={17} /></div><div className="min-w-0"><div className="text-[13px] font-bold">{shortName(subject.subject_name)}</div><div className="muted mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px]"><span className="flex items-center gap-1.5"><CalendarDays size={12} />{formatExamDate(subject.exam?.exam_date ?? null)}</span><span className="flex items-center gap-1.5"><Clock3 size={12} />{subject.exam?.exam_time ? subject.exam.exam_time.slice(0, 5) : "Time not set"}</span></div></div></div><div className="flex items-center justify-between gap-4 md:justify-end"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${countdown.tone === "urgent" ? "bg-[#fff0eb] text-[#b76546]" : countdown.tone === "soon" ? "bg-[#f8f1e7] text-[#98723f]" : countdown.tone === "muted" ? "bg-[#f0f1f3] text-[#737987]" : "bg-[#edf3ef] text-[#587362]"}`}>{countdown.label}</span><button onClick={() => openExam(subject)} className="flex items-center gap-1.5 rounded-lg border border-[#e6e8eb] px-3 py-2 text-[10px] font-semibold hover:bg-[#f7f8fa]"><Pencil size={13} />Edit exam</button></div></div>;})}</div></div>;
}

function AnalyticsPage({ subjects, totalUnits, completedUnits, progress }: { subjects: Subject[]; totalUnits: number; completedUnits: number; progress: number }) {
  const ranked = [...subjects].sort((a, b) => (b.units.filter((unit) => unit.is_completed).length / b.total_units) - (a.units.filter((unit) => unit.is_completed).length / a.total_units));
  const highest = ranked[0];
  const lowest = ranked[ranked.length - 1];
  const highestProgress = highest?.total_units ? Math.round(highest.units.filter((unit) => unit.is_completed).length / highest.total_units * 100) : 0;
  const lowestProgress = lowest?.total_units ? Math.round(lowest.units.filter((unit) => unit.is_completed).length / lowest.total_units * 100) : 0;
  return <div><PageHeading eyebrow="YOUR MOMENTUM" title="Study analytics" description="A clear picture of your real, saved syllabus progress." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Overall completion" value={`${progress}%`} detail={`${completedUnits} of ${totalUnits}`} icon={TrendingUp} change={progress ? "up" : undefined} /><StatCard label="Completed units" value={String(completedUnits)} detail="Across all subjects" icon={CheckCircle2} /><StatCard label="Pending units" value={String(totalUnits - completedUnits)} detail="Still to cover" icon={Target} /><StatCard label="Subject completion" value={`${subjects.filter((subject) => subject.units.length > 0 && subject.units.every((unit) => unit.is_completed)).length}/${subjects.length}`} detail="Fully completed" icon={GraduationCap} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_1fr]"><section className="surface rounded-xl border border-[#e9ebef] bg-white p-5 md:p-6"><h2 className="text-[14px] font-bold">Syllabus completion</h2><p className="muted mt-1 text-[11px]">Completed versus pending units</p><div className="mt-8 flex items-center gap-7"><div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#789786 ${progress * 3.6}deg, #edf0f2 ${progress * 3.6}deg)` }}><div className="surface flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-white"><span className="font-[Manrope] text-[25px] font-bold">{progress}%</span><span className="muted text-[10px]">complete</span></div></div><div className="space-y-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#789786]" /><div><div className="text-[12px] font-semibold">{completedUnits} completed</div><div className="muted text-[10px]">Units studied</div></div></div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#e6e9ec]" /><div><div className="text-[12px] font-semibold">{totalUnits - completedUnits} pending</div><div className="muted text-[10px]">Units to go</div></div></div></div></div><div className="mt-8"><ProgressBar value={progress} /></div></section>
    <section className="surface rounded-xl border border-[#e9ebef] bg-white p-5 md:p-6"><h2 className="text-[14px] font-bold">Subject-wise progress</h2><p className="muted mt-1 text-[11px]">Completion based on checked-off units</p><div className="mt-6 space-y-5">{subjects.map((subject) => {const count = subject.units.filter((unit) => unit.is_completed).length; const value = subject.total_units ? Math.round(count / subject.total_units * 100) : 0; return <div key={subject.id}><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-medium">{shortName(subject.subject_name)}</span><span className="muted text-[10px]">{count}/{subject.total_units} · {value}%</span></div><ProgressBar value={value} /></div>;})}</div></section></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="surface rounded-xl border border-[#e9ebef] bg-white p-5"><div className="muted text-[10px] font-semibold uppercase tracking-wider">Most progress</div>{highest ? <div className="mt-3 flex items-center justify-between"><div><div className="text-[14px] font-bold">{shortName(highest.subject_name)}</div><div className="muted mt-1 text-[10px]">{highest.units.filter((unit) => unit.is_completed).length} of {highest.total_units} units complete</div></div><div className="font-[Manrope] text-[23px] font-bold text-[#64836e]">{highestProgress}%</div></div> : <p className="muted mt-3 text-sm">No subject data yet.</p>}</div><div className="surface rounded-xl border border-[#e9ebef] bg-white p-5"><div className="muted text-[10px] font-semibold uppercase tracking-wider">Needs attention</div>{lowest ? <div className="mt-3 flex items-center justify-between"><div><div className="text-[14px] font-bold">{shortName(lowest.subject_name)}</div><div className="muted mt-1 text-[10px]">{lowest.units.filter((unit) => unit.is_completed).length} of {lowest.total_units} units complete</div></div><div className="font-[Manrope] text-[23px] font-bold text-[#9b8063]">{lowestProgress}%</div></div> : <p className="muted mt-3 text-sm">No subject data yet.</p>}</div></div>
  </div>;
}

function SettingsPage({ email, darkMode, setDarkMode, resetAll }: { email: string; darkMode: boolean; setDarkMode: (value: boolean) => void; resetAll: () => void }) {
  return <div><PageHeading eyebrow="PREFERENCES" title="Settings" description="Manage your personal SEMTRACK experience." /><div className="max-w-[720px] space-y-4"><section className="surface rounded-xl border border-[#e9ebef] bg-white p-5"><h2 className="text-[13px] font-bold">Account</h2><p className="muted mt-1 text-[11px]">Your progress is securely associated with this account.</p><div className="mt-4 rounded-lg bg-[#f7f8f9] px-3 py-3 text-[12px]">{email}</div></section><section className="surface flex items-center justify-between rounded-xl border border-[#e9ebef] bg-white p-5"><div><h2 className="text-[13px] font-bold">Appearance</h2><p className="muted mt-1 text-[11px]">Choose a comfortable theme for your study sessions.</p></div><button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-2 rounded-lg border border-[#e6e8eb] px-3 py-2 text-[11px] font-semibold">{darkMode ? <Sun size={14} /> : <Moon size={14} />}{darkMode ? "Light mode" : "Dark mode"}</button></section><section className="surface rounded-xl border border-[#e9ebef] bg-white p-5"><h2 className="text-[13px] font-bold">Study data</h2><p className="muted mt-1 text-[11px]">Your data is stored in Supabase and follows your account across devices.</p><button onClick={resetAll} className="mt-4 flex items-center gap-2 rounded-lg border border-[#eadbd8] px-3 py-2 text-[11px] font-semibold text-[#a35c51] hover:bg-[#fff7f5]"><RotateCcw size={14} />Reset all syllabus progress</button><p className="muted mt-2 text-[10px]">Your examination dates and account will not be changed.</p></section><section className="surface rounded-xl border border-[#e9ebef] bg-white p-5"><h2 className="text-[13px] font-bold">About SEMTRACK</h2><p className="muted mt-2 text-[11px] leading-5">A personal study dashboard for your Third Year Computer Engineering end-semester examinations. All saved progress is synced to your cloud database.</p></section></div></div>;
}

function ExamModal({ subject, busy, onClose, onSave }: { subject: Subject; busy: boolean; onClose: () => void; onSave: (subject: Subject, date: string, time: string) => void }) {
  const [date, setDate] = useState(subject.exam?.exam_date ?? "");
  const [time, setTime] = useState(subject.exam?.exam_time?.slice(0, 5) ?? "");
  function submit(event: FormEvent) { event.preventDefault(); onSave(subject, date, time); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-labelledby="exam-modal-title" className="surface w-full max-w-[420px] rounded-2xl border border-[#e9ebef] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="mb-1 text-[10px] font-bold tracking-wider text-[#668878]">EXAMINATION</div><h2 id="exam-modal-title" className="text-[17px] font-bold">{shortName(subject.subject_name)}</h2><p className="muted mt-1 text-[11px]">Set the date and time in Indian Standard Time.</p></div><button onClick={onClose} aria-label="Close" className="muted rounded-lg p-1.5 hover:bg-[#f3f4f6]"><X size={17} /></button></div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-[11px] font-semibold">Examination date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#e1e4e9] bg-white px-3 text-[12px] outline-none focus:border-[#829c8c]" /></label><label className="block text-[11px] font-semibold">Examination time <span className="muted font-normal">· optional</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} disabled={!date} className="mt-2 h-11 w-full rounded-lg border border-[#e1e4e9] bg-white px-3 text-[12px] outline-none focus:border-[#829c8c] disabled:opacity-50" /></label><p className="muted text-[10px]">Leave the date empty to remove this examination from your timetable.</p><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-lg border border-[#e6e8eb] px-4 py-2.5 text-[11px] font-semibold">Cancel</button><button disabled={busy} className="rounded-lg bg-[#282e3a] px-4 py-2.5 text-[11px] font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save examination"}</button></div></form></div></div>;
}

export default App;
