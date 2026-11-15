import { Exam } from "./types";

export type CountdownResult = {
  label: string;
  tone: "urgent" | "soon" | "neutral" | "muted";
  days: number | null;
};

export function getTodayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function examCountdown(exam: Exam | null): CountdownResult {
  if (!exam?.exam_date) return { label: "Date not set", tone: "neutral", days: null };
  const today = getTodayInIndia();
  const dayDifference = Math.round(
    (Date.parse(`${exam.exam_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  if (dayDifference < 0) return { label: "Exam Completed", tone: "muted", days: dayDifference };
  if (dayDifference === 0) {
    if (exam.exam_time) {
      const now = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
      if (now >= exam.exam_time.slice(0, 5)) return { label: "Exam Completed", tone: "muted", days: 0 };
    }
    return { label: "Today", tone: "urgent", days: 0 };
  }
  if (dayDifference === 1) return { label: "Tomorrow", tone: "urgent", days: 1 };
  return {
    label: `${dayDifference} Days Remaining`,
    tone: dayDifference <= 7 ? "soon" : "neutral",
    days: dayDifference,
  };
}

export function formatExamDate(date: string | null): string {
  if (!date) return "Choose date";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00+05:30`));
}

export function formatExamTime(time: string | null): string {
  if (!time) return "Time not set";
  const [hourStr, minuteStr] = time.slice(0, 5).split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export type SubjectMeta = {
  displayName: string;
  code: string;
  category: string;
};

export function parseSubjectMeta(name: string): SubjectMeta {
  if (name.includes("Theory of Computation") || name.includes("(TOC)")) {
    return { displayName: "Theory of Computation", code: "TOC", category: "Core Theory" };
  }
  if (name.includes("Artificial Intelligence") || name.includes("(AI)")) {
    return { displayName: "Artificial Intelligence", code: "AI", category: "Intelligence" };
  }
  if (name.includes("Computer Networks") || name.includes("(CN)")) {
    return { displayName: "Computer Networks", code: "CN", category: "Networking" };
  }
  if (name.includes("Cloud Computing")) {
    return { displayName: "Cloud Computing", code: "CC", category: "Systems" };
  }
  if (name.includes("IPR") || name.includes("Cyber Laws")) {
    return { displayName: "IPR & Cyber Laws", code: "IPR", category: "Ethics & Law" };
  }
  return { displayName: name, code: name.slice(0, 3).toUpperCase(), category: "Engineering" };
}

export function shortName(name: string): string {
  return parseSubjectMeta(name).displayName;
}

export function getGreeting(name: string = "Vishal"): { greeting: string; subtitle: string } {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
    10,
  );
  let prefix = "Good morning";
  if (hour >= 12 && hour < 17) prefix = "Good afternoon";
  else if (hour >= 17) prefix = "Good evening";

  return {
    greeting: `${prefix}, ${name}!`,
    subtitle: "Your progress today brings you closer to your goal.",
  };
}

export const motivationalQuotes = [
  "Small progress each day adds up to big results.",
  "You don't have to be perfect. Just keep showing up.",
  "The secret of getting ahead is getting started.",
  "Focus on the step in front of you, not the whole staircase.",
  "Discipline is choosing what you want most over what you want now.",
  "A little progress every day adds up to a lot over time.",
  "Your future is created by what you do today, not tomorrow.",
];
