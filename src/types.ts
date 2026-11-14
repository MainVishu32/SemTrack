export type Unit = {
  id: string;
  unit_number: number;
  is_completed: boolean;
  completed_at: string | null;
};

export type Exam = {
  id: string;
  exam_date: string | null;
  exam_time: string | null;
};

export type Subject = {
  id: string;
  subject_name: string;
  total_units: number;
  units: Unit[];
  exam: Exam | null;
};

export type Page = "Dashboard" | "My Subjects" | "Exam Timetable" | "Analytics" | "Settings" | "Glass Hero";
