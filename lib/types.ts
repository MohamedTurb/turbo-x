export type Role = "student" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
  email?: string | null;
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  published: boolean;
  created_at: string;
  duration_minutes: number | null;
}

export interface QuizWithCount extends Quiz {
  question_count?: number;
}

export type QuestionOptions = string[];

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  options: QuestionOptions;
  correct_answer: string;
  points: number;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: string;
  score: number;
  total_points: number;
  percentage: number;
  created_at: string;
}

export interface QuizAttemptWithQuiz extends QuizAttempt {
  quiz?: Pick<Quiz, "id" | "title">;
}

export interface Assignment {
  id: number;
  title: string;
  description: string | null;
  file_path: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: string;
  file_path: string | null;
  grade: number | null;
  feedback: string | null;
  created_at: string;
}

export interface QuestionDraft {
  question_text: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: string;
  points: number;
}