import type {
  Question,
  QuestionAnswer,
} from "../types/question";

import type {
  AppProgress,
  QuestionStats,
  QuizHistoryItem,
} from "../types/progress";

import type {
  EvolutionPoint,
  OverallPerformance,
  PreparationStatus,
  QuizSessionResult,
  SessionTopicPerformance,
} from "../types/stats";

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

function percentage(
  value: number,
  total: number,
): number {
  if (
    total <= 0
  ) {
    return 0;
  }

  return Math.round(
    (value / total) *
      100,
  );
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}

function getPreparationStatus(
  preparationIndex: number,
): PreparationStatus {
  if (
    preparationIndex >= 85
  ) {
    return "ready";
  }

  if (
    preparationIndex >= 70
  ) {
    return "strong";
  }

  if (
    preparationIndex >= 45
  ) {
    return "progressing";
  }

  return "starting";
}

function getTopicStatus(
  attempts: number,
  accuracy: number,
): TopicPerformance["status"] {
  if (
    attempts === 0
  ) {
    return "unstarted";
  }

  if (
    accuracy >= 85
  ) {
    return "strong";
  }

  if (
    accuracy >= 70
  ) {
    return "progressing";
  }

  return "reinforce";
}

/*
 * Índice de preparación:
 *
 * accuracy × sqrt(coverage)
 *
 * La cobertura se expresa en escala 0-1.
 *
 * Esto hace que una precisión alta no pueda esconder
 * que solamente se ha estudiado una pequeña parte
 * del banco.
 *
 * Ejemplo:
 *
 * 95% precisión
 * 10% cobertura
 *
 * preparación ≈ 30%
 */
export function calculatePreparationIndex(
  accuracy: number,
  coverage: number,
): number {
  if (
    accuracy <= 0 ||
    coverage <= 0
  ) {
    return 0;
  }

  const coverageFactor =
    Math.sqrt(
      clamp(
        coverage,
        0,
        100,
      ) / 100,
    );

  return Math.round(
    clamp(
      accuracy *
        coverageFactor,
      0,
      100,
    ),
  );
}

export function getOverallPerformance(
  questions: readonly Question[],
  progress: AppProgress,
): OverallPerformance {
  let studiedQuestions =
    0;

  let attempts = 0;
  let correct = 0;
  let incorrect = 0;

  for (
    const question
    of questions
  ) {
    const stats =
      progress.questionStats[
        question.id
      ];

    if (
      !stats
    ) {
      continue;
    }

    if (
      stats.attempts > 0
    ) {
      studiedQuestions +=
        1;
    }

    attempts +=
      stats.attempts;

    correct +=
      stats.correct;

    incorrect +=
      stats.incorrect;
  }

  const totalQuestions =
    questions.length;

  const accuracy =
    percentage(
      correct,
      attempts,
    );

  const coverage =
    percentage(
      studiedQuestions,
      totalQuestions,
    );

  const preparationIndex =
    calculatePreparationIndex(
      accuracy,
      coverage,
    );

  return {
    totalQuestions,

    studiedQuestions,

    unseenQuestions:
      totalQuestions -
      studiedQuestions,

    attempts,

    correct,

    incorrect,

    accuracy,

    coverage,

    preparationIndex,

    status:
      getPreparationStatus(
        preparationIndex,
      ),
  };
}

export function getTopicPerformance(
  questions: readonly Question[],
  progress: AppProgress,
): TopicPerformance[] {
  const topics =
    new Map<
      string,
      Question[]
    >();

  for (
    const question
    of questions
  ) {
    const current =
      topics.get(
        question.tema,
      ) ?? [];

    current.push(
      question,
    );

    topics.set(
      question.tema,
      current,
    );
  }

  return Array.from(
    topics.entries(),
  ).map(
    (
      [
        topic,
        topicQuestions,
      ],
    ) => {
      let seenQuestions =
        0;

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

        if (
          !stats
        ) {
          continue;
        }

        if (
          stats.attempts >
          0
        ) {
          seenQuestions +=
            1;
        }

        attempts +=
          stats.attempts;

        correct +=
          stats.correct;

        incorrect +=
          stats.incorrect;
      }

      const accuracy =
        percentage(
          correct,
          attempts,
        );

      const coverage =
        percentage(
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
          getTopicStatus(
            attempts,
            accuracy,
          ),
      };
    },
  );
}

export function buildSessionResult(
  questions:
    readonly Question[],
  answers:
    readonly QuestionAnswer[],
  durationSeconds: number,
): QuizSessionResult {
  const questionById =
    new Map(
      questions.map(
        (question) => [
          question.id,
          question,
        ],
      ),
    );

  const topicMap =
    new Map<
      string,
      {
        total: number;
        correct: number;
        incorrect: number;
      }
    >();

  const failedQuestionIds:
    number[] = [];

  let correct = 0;

  for (
    const answer
    of answers
  ) {
    const question =
      questionById.get(
        answer.questionId,
      );

    if (
      !question
    ) {
      continue;
    }

    const current =
      topicMap.get(
        question.tema,
      ) ?? {
        total: 0,
        correct: 0,
        incorrect: 0,
      };

    current.total += 1;

    if (
      answer.isCorrect
    ) {
      current.correct += 1;

      correct += 1;
    } else {
      current.incorrect +=
        1;

      failedQuestionIds.push(
        question.id,
      );
    }

    topicMap.set(
      question.tema,
      current,
    );
  }

  const topicBreakdown:
    SessionTopicPerformance[] =
    Array.from(
      topicMap.entries(),
    ).map(
      (
        [
          topic,
          stats,
        ],
      ) => ({
        topic,

        ...stats,

        percentage:
          percentage(
            stats.correct,
            stats.total,
          ),
      }),
    );

  const total =
    answers.length;

  const incorrect =
    total - correct;

  return {
    total,

    correct,

    incorrect,

    percentage:
      percentage(
        correct,
        total,
      ),

    durationSeconds,

    topicBreakdown,

    failedQuestionIds,
  };
}

export function getEvolutionData(
  history:
    readonly QuizHistoryItem[],
  limit = 10,
): EvolutionPoint[] {
  /*
   * Para medir evolución preferimos simulacros
   * generales/examen.
   *
   * Un test únicamente de meteorología no sería
   * comparable con un simulacro general.
   */
  const comparable =
    history.filter(
      (item) =>
        item.mode ===
          "general" ||
        item.mode ===
          "exam",
    );

  const source =
    comparable.length > 0
      ? comparable
      : history;

  return source
    .slice(
      0,
      limit,
    )
    .reverse()
    .map(
      (
        item,
        index,
      ) => ({
        id:
          item.id,

        label:
          String(
            index + 1,
          ),

        percentage:
          item.percentage,

        date:
          item.finishedAt,
      }),
    );
}

export function getWeakQuestions(
  questions:
    readonly Question[],
  progress:
    AppProgress,
): WeakQuestion[] {
  const weak:
    WeakQuestion[] = [];

  for (
    const question
    of questions
  ) {
    const stats =
      progress.questionStats[
        question.id
      ];

    if (
      !stats ||
      stats.attempts <=
        0 ||
      stats.incorrect <=
        0
    ) {
      continue;
    }

    const errorRate =
      stats.incorrect /
      stats.attempts;

    const errorRateWeight =
      errorRate * 5;

    const repeatedWeight =
      Math.min(
        stats.incorrect *
          0.2,
        2,
      );

    const lastErrorWeight =
      stats.lastWasCorrect ===
      false
        ? 1.5
        : 0;

    weak.push({
      question,

      stats,

      errorRate,

      score:
        errorRateWeight +
        repeatedWeight +
        lastErrorWeight,
    });
  }

  return weak.sort(
    (a, b) =>
      b.score -
      a.score,
  );
}