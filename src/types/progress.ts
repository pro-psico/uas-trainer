import type {
  SessionTopicPerformance,
} from "./stats";

export type QuizMode =
  | "general"
  | "topic"
  | "mistakes"
  | "review"
  | "exam";

export interface QuestionStats {
  questionId: number;

  attempts: number;
  correct: number;
  incorrect: number;

  currentStreak: number;

  lastWasCorrect:
    | boolean
    | null;

  lastAnsweredAt:
    | string
    | null;
}

export interface QuizHistoryItem {
  id: string;

  mode: QuizMode;

  topic?: string;

  startedAt: string;
  finishedAt: string;

  durationSeconds: number;

  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;

  percentage: number;

  /*
   * Son opcionales para mantener compatibilidad
   * con simulacros guardados en versiones anteriores.
   */
  topicBreakdown?: SessionTopicPerformance[];

  failedQuestionIds?: number[];
}

export interface AppProgress {
  version: 1;

  questionStats:
    Record<
      number,
      QuestionStats
    >;

  history:
    QuizHistoryItem[];
}