export interface QuestionStats {
  questionId: number;
  attempts: number;
  correct: number;
  incorrect: number;
  currentStreak: number;
  lastWasCorrect: boolean | null;
  lastAnsweredAt: string | null;
}

export interface QuizHistoryItem {
  id: string;
  mode: "general" | "topic" | "mistakes" | "exam";
  topic?: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
}

export interface AppProgress {
  version: 1;
  questionStats: Record<number, QuestionStats>;
  history: QuizHistoryItem[];
}