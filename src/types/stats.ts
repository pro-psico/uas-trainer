export type PreparationStatus =
  | "starting"
  | "progressing"
  | "strong"
  | "ready";

export interface SessionTopicPerformance {
  topic: string;
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
}

export interface QuizSessionResult {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
  durationSeconds: number;

  topicBreakdown: SessionTopicPerformance[];

  failedQuestionIds: number[];
}

export interface OverallPerformance {
  totalQuestions: number;
  studiedQuestions: number;
  unseenQuestions: number;

  attempts: number;
  correct: number;
  incorrect: number;

  accuracy: number;
  coverage: number;

  preparationIndex: number;

  status: PreparationStatus;
}

export interface EvolutionPoint {
  id: string;
  label: string;
  percentage: number;
  date: string;
}