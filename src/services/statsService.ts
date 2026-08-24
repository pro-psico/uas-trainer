import type { Question } from "../types/question";
import type {
  AppProgress,
  QuestionStats,
} from "../types/progress";

export interface TopicPerformance {
  topic: string;
  totalQuestions: number;
  seenQuestions: number;
  unseenQuestions: number;

  attempts: number;
  correct: number;
  incorrect: number;

  accuracy: number;
  coverage: number;

  status:
    | "unstarted"
    | "reinforce"
    | "progressing"
    | "strong";
}

export interface WeakQuestion {
  question: Question;
  stats: QuestionStats;

  errorRate: number;
  score: number;
}

function calculatePercentage(
  value: number,
  total: number,
): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round(
    (value / total) * 100,
  );
}

function getPerformanceStatus(
  attempts: number,
  accuracy: number,
): TopicPerformance["status"] {
  if (attempts === 0) {
    return "unstarted";
  }

  if (accuracy >= 85) {
    return "strong";
  }

  if (accuracy >= 70) {
    return "progressing";
  }

  return "reinforce";
}

export function getTopicPerformance(
  questions: readonly Question[],
  progress: AppProgress,
): TopicPerformance[] {
  const topics = new Map<
    string,
    Question[]
  >();

  for (const question of questions) {
    const current =
      topics.get(question.tema) ?? [];

    current.push(question);

    topics.set(
      question.tema,
      current,
    );
  }

  return Array.from(
    topics.entries(),
  ).map(
    ([topic, topicQuestions]) => {
      let seenQuestions = 0;
      let attempts = 0;
      let correct = 0;
      let incorrect = 0;

      for (
        const question
        of topicQuestions
      ) {
        const stats =
          progress.questionStats[
            question.id
          ];

        if (!stats) {
          continue;
        }

        if (
          stats.attempts > 0
        ) {
          seenQuestions += 1;
        }

        attempts +=
          stats.attempts;

        correct +=
          stats.correct;

        incorrect +=
          stats.incorrect;
      }

      const accuracy =
        calculatePercentage(
          correct,
          attempts,
        );

      const coverage =
        calculatePercentage(
          seenQuestions,
          topicQuestions.length,
        );

      return {
        topic,

        totalQuestions:
          topicQuestions.length,

        seenQuestions,

        unseenQuestions:
          topicQuestions.length -
          seenQuestions,

        attempts,
        correct,
        incorrect,

        accuracy,
        coverage,

        status:
          getPerformanceStatus(
            attempts,
            accuracy,
          ),
      };
    },
  );
}

export function getWeakQuestions(
  questions: readonly Question[],
  progress: AppProgress,
): WeakQuestion[] {
  const weakQuestions:
    WeakQuestion[] = [];

  for (const question of questions) {
    const stats =
      progress.questionStats[
        question.id
      ];

    if (
      !stats ||
      stats.incorrect <= 0 ||
      stats.attempts <= 0
    ) {
      continue;
    }

    const errorRate =
      stats.incorrect /
      stats.attempts;

    /*
     * Priorizamos:
     *
     * 1. Alto porcentaje de error.
     * 2. Cantidad absoluta de errores.
     * 3. Haber fallado la última vez.
     */

    const errorRateWeight =
      errorRate * 5;

    const repeatedMistakeWeight =
      Math.min(
        stats.incorrect * 0.2,
        2,
      );

    const recentMistakeWeight =
      stats.lastWasCorrect === false
        ? 1.5
        : 0;

    const score =
      errorRateWeight +
      repeatedMistakeWeight +
      recentMistakeWeight;

    weakQuestions.push({
      question,
      stats,
      errorRate,
      score,
    });
  }

  return weakQuestions.sort(
    (a, b) =>
      b.score - a.score,
  );
}