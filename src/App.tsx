import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";
import { AlertCircle, X } from "lucide-react";
import { Page, Subject } from "./types";
import { motivationalQuotes, shortName } from "./utils";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ExamModal } from "./components/ExamModal";
import { Toast } from "./components/Toast";
import { DashboardPage } from "./pages/DashboardPage";
import { SubjectsPage } from "./pages/SubjectsPage";
import { TimetablePage } from "./pages/TimetablePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GlassShardHero } from "./components/GlassShardHero";
import { AuthScreen } from "./pages/AuthScreen";
import { LoadingScreen } from "./pages/LoadingScreen";
import { ConfigurationNotice } from "./pages/ConfigurationNotice";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [page, setPage] = useState<Page>("Dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(
    () => localStorage.getItem("semtrack-theme") === "dark"
  );
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [examEditor, setExamEditor] = useState<Subject | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3400);
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase || !session) return;
    setDataReady(false);
    setError("");

    const { data: subjectRows, error: subjectsError } = await supabase
      .from("subjects")
      .select("id, subject_name, total_units")
      .order("subject_name");

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
      supabase
        .from("units")
        .select("id, subject_id, unit_number, is_completed, completed_at")
        .in("subject_id", ids)
        .order("unit_number"),
      supabase
        .from("exams")
        .select("id, subject_id, exam_date, exam_time")
        .in("subject_id", ids),
    ]);

    if (unitsResult.error || examsResult.error) {
      setError(
        `Could not load your study data: ${
          (unitsResult.error ?? examsResult.error)?.message ?? "Unknown database error"
        }`
      );
      setDataReady(true);
      return;
    }

    setSubjects(
      (subjectRows ?? []).map((row) => {
        const exam = (examsResult.data ?? []).find(
          (item) => item.subject_id === row.id
        );
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
            ? {
                id: exam.id as string,
                exam_date: exam.exam_date as string | null,
                exam_time: exam.exam_time as string | null,
              }
            : null,
        };
      })
    );
    setDataReady(true);
  }, [session]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError(`Could not restore your session: ${sessionError.message}`);
        setSession(data.session);
        setAuthReady(true);
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        setError(`Could not restore your session: ${String(sessionError)}`);
        setSession(null);
        setAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSubjects([]);
      setDataReady(false);
      setError("");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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

  const totalUnits = useMemo(
    () => subjects.reduce((total, subject) => total + subject.total_units, 0),
    [subjects]
  );
  const completedUnits = useMemo(
    () =>
      subjects.reduce(
        (total, subject) =>
          total + subject.units.filter((unit) => unit.is_completed).length,
        0
      ),
    [subjects]
  );
  const remainingUnits = totalUnits - completedUnits;
  const overallProgress = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const motivationalQuote =
    motivationalQuotes[Math.floor(Date.now() / 86_400_000) % motivationalQuotes.length];

  // Derive user name for greeting
  const userName = useMemo(() => {
    if (session?.user?.user_metadata?.full_name) {
      return session.user.user_metadata.full_name.split(" ")[0];
    }
    if (session?.user?.email) {
      const emailPrefix = session.user.email.split("@")[0];
      if (emailPrefix.toLowerCase().includes("vishal")) return "Vishal";
      const cap = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      return cap.length > 2 && !cap.match(/\d{4,}/) ? cap : "Vishal";
    }
    return "Vishal";
  }, [session]);

  async function toggleUnit(subjectId: string, unitId: string, completed: boolean) {
    if (!supabase) return;
    const unit = subjects
      .find((subject) => subject.id === subjectId)
      ?.units.find((item) => item.id === unitId);
    if (!unit) return;

    const nextCompleted = !completed;
    const completedAt = nextCompleted ? new Date().toISOString() : null;

    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              units: subject.units.map((item) =>
                item.id === unitId
                  ? { ...item, is_completed: nextCompleted, completed_at: completedAt }
                  : item
              ),
            }
          : subject
      )
    );

    const { data: savedUnit, error: updateError } = await supabase
      .from("units")
      .update({ is_completed: nextCompleted, completed_at: completedAt })
      .eq("id", unitId)
      .select("id")
      .single();

    if (updateError || !savedUnit) {
      // Rollback
      setSubjects((current) =>
        current.map((subject) =>
          subject.id === subjectId
            ? {
                ...subject,
                units: subject.units.map((item) =>
                  item.id === unitId
                    ? { ...item, is_completed: completed, completed_at: unit.completed_at }
                    : item
                ),
              }
            : subject
        )
      );
      setError(
        `Your progress was not saved: ${
          updateError?.message ?? "The unit could not be found in your account."
        }`
      );
      return;
    }

    const resultingSubject = subjects.find((subject) => subject.id === subjectId);
    const wasLastSubjectUnit =
      nextCompleted &&
      resultingSubject &&
      resultingSubject.units.filter((item) => item.is_completed).length + 1 ===
        resultingSubject.total_units;
    const wasLastOverallUnit = nextCompleted && completedUnits + 1 === totalUnits;

    if (wasLastOverallUnit) {
      notify("Incredible work — all 24 units are complete! 🎉");
    } else if (wasLastSubjectUnit) {
      notify(`Amazing — ${shortName(resultingSubject!.subject_name)} is complete! 🎉`);
    } else {
      notify(nextCompleted ? "Unit marked complete & saved." : "Unit marked as pending.");
    }
  }

  async function saveExam(subject: Subject, date: string, time: string) {
    if (!supabase) {
      setError("Your timetable change was not saved: Supabase is not configured in this deployment.");
      return;
    }
    setBusy(true);
    try {
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw new Error(`Could not verify your sign-in session: ${sessionError.message}`);
      if (!currentSession) throw new Error("Your session has expired. Sign in again before saving.");

      const { data: savedExam, error: saveError } = await supabase
        .from("exams")
        .upsert(
          {
            user_id: currentSession.user.id,
            subject_id: subject.id,
            exam_date: date || null,
            exam_time: date ? time || null : null,
          },
          { onConflict: "subject_id" }
        )
        .select("id, subject_id, exam_date, exam_time")
        .single();

      if (saveError) throw saveError;
      if (!savedExam) throw new Error("Supabase did not return the saved examination.");

      setSubjects((current) =>
        current.map((item) =>
          item.id === subject.id
            ? {
                ...item,
                exam: {
                  id: savedExam.id as string,
                  exam_date: savedExam.exam_date as string | null,
                  exam_time: savedExam.exam_time as string | null,
                },
              }
            : item
        )
      );
      setExamEditor(null);
      notify("Examination timetable updated.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : String(saveError);
      const networkHint = message === "Failed to fetch"
        ? ` Check that this deployment's VITE_SUPABASE_URL points to the same Supabase project and that its Vercel environment variables were redeployed.`
        : "";
      setError(`Your timetable change was not saved: ${message}.${networkHint}`);
    } finally {
      setBusy(false);
    }
  }

  async function resetSubject(subject: Subject) {
    if (
      !supabase ||
      !window.confirm(
        `Reset all ${subject.total_units} units in ${shortName(
          subject.subject_name
        )}? This cannot be undone.`
      )
    )
      return;

    const { data: resetUnits, error: resetError } = await supabase
      .from("units")
      .update({ is_completed: false, completed_at: null })
      .eq("subject_id", subject.id)
      .select("id");

    if (resetError || resetUnits?.length !== subject.total_units) {
      setError(
        `Could not reset subject progress: ${
          resetError?.message ?? "Not all units in this subject could be updated."
        }`
      );
      return;
    }

    setSubjects((current) =>
      current.map((item) =>
        item.id === subject.id
          ? {
              ...item,
              units: item.units.map((unit) => ({
                ...unit,
                is_completed: false,
                completed_at: null,
              })),
            }
          : item
      )
    );
    notify(`${shortName(subject.subject_name)} progress reset.`);
  }

  async function resetAll() {
    if (
      !supabase ||
      !window.confirm(
        "Reset progress for every subject? Your exam timetable will remain unchanged."
      )
    )
      return;

    const { data: resetUnits, error: resetError } = await supabase
      .from("units")
      .update({ is_completed: false, completed_at: null })
      .in(
        "subject_id",
        subjects.map((subject) => subject.id)
      )
      .select("id");

    if (resetError || resetUnits?.length !== totalUnits) {
      setError(
        `Could not reset syllabus progress: ${
          resetError?.message ?? "Not all syllabus units could be updated."
        }`
      );
      return;
    }

    setSubjects((current) =>
      current.map((subject) => ({
        ...subject,
        units: subject.units.map((unit) => ({
          ...unit,
          is_completed: false,
          completed_at: null,
        })),
      }))
    );
    notify("All syllabus progress has been reset.");
  }

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(`Could not sign out: ${signOutError.message}`);
  };

  if (!supabase) return <ConfigurationNotice />;
  if (!authReady) return <LoadingScreen label="Connecting securely to Supabase..." />;
  if (!session) {
    return (
      <AuthScreen
        supabase={supabase}
        error={error}
        onError={setError}
        onClearError={() => setError("")}
      />
    );
  }
  if (!dataReady) return <LoadingScreen label="Loading your semester workspace..." />;

  return (
    <div className={`min-h-screen bg-[#E8DDC9] dark:bg-[#171717] text-[#24211E] dark:text-[#F4EBDD] bg-ambient-grain transition-colors ${darkMode ? "dark" : ""}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        page={page}
        setPage={setPage}
        overallProgress={overallProgress}
        userEmail={session.user.email ?? ""}
        onSignOut={handleSignOut}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[268px] min-h-screen flex flex-col transition-all">
        {/* Top Header */}
        <Header
          page={page}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setMobileNav={setMobileNav}
        />

        {/* Page Body Container */}
        <main className="flex-1 px-5 py-6 md:px-10 md:py-8 max-w-[1400px] w-full mx-auto">
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-[13px] font-medium text-red-600 dark:text-red-400 animate-rise-in shadow-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Page Routing */}
          <div key={page} className="animate-rise-in">
            {page === "Dashboard" && (
              <DashboardPage
                subjects={subjects}
                totalUnits={totalUnits}
                completedUnits={completedUnits}
                remainingUnits={remainingUnits}
                progress={overallProgress}
                quote={motivationalQuote}
                userName={userName}
                toggleUnit={toggleUnit}
                setPage={setPage}
                openExam={setExamEditor}
              />
            )}
            {page === "My Subjects" && (
              <SubjectsPage
                subjects={subjects}
                toggleUnit={toggleUnit}
                resetSubject={resetSubject}
              />
            )}
            {page === "Exam Timetable" && (
              <TimetablePage subjects={subjects} openExam={setExamEditor} />
            )}
            {page === "Analytics" && (
              <AnalyticsPage
                subjects={subjects}
                totalUnits={totalUnits}
                completedUnits={completedUnits}
                progress={overallProgress}
              />
            )}
            {page === "Glass Hero" && (
              <GlassShardHero showBackToDashboard onClose={() => setPage("Dashboard")} />
            )}
            {page === "Settings" && (
              <SettingsPage
                email={session.user.email ?? ""}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                resetAll={resetAll}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Notification Toast */}
      <Toast message={toast} onClose={() => setToast("")} />

      {/* Dynamic Exam Editor Modal */}
      {examEditor && (
        <ExamModal
          subject={examEditor}
          busy={busy}
          onClose={() => setExamEditor(null)}
          onSave={saveExam}
        />
      )}
    </div>
  );
}

export default App;
