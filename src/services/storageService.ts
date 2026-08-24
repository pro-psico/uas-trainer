import type {
  AppProgress,
  QuestionStats,
  QuizHistoryItem,
} from "../types/progress";

const STORAGE_KEY = "uas-trainer-progress-v1";

const createEmptyProgress = (): AppProgress => ({
  version: 1,
  questionStats: {},
  history: [],
});

export function loadProgress(): AppProgress {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);

    if (!rawData) {
      return createEmptyProgress();
    }

    const parsed = JSON.parse(rawData) as Partial<AppProgress>;

    if (
      parsed.version !== 1 ||
      typeof parsed.questionStats !== "object" ||
      !Array.isArray(parsed.history)
    ) {
      console.warn(
        "Los datos locales tienen un formato inválido. Se iniciará un nuevo progreso.",
      );

      return createEmptyProgress();
    }

    return {
      version: 1,
      questionStats: parsed.questionStats ?? {},
      history: parsed.history ?? [],
    };
  } catch (error) {
    console.error(
      "No fue posible cargar el progreso:",
      error,
    );

    return createEmptyProgress();
  }
}

function saveProgress(progress: AppProgress): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress),
    );
  } catch (error) {
    console.error(
      "No fue posible guardar el progreso:",
      error,
    );
  }
}

export function registerAnswer(
  questionId: number,
  isCorrect: boolean,
): QuestionStats {
  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw new Error(
      `ID de pregunta inválido: ${questionId}`,
    );
  }

  const progress = loadProgress();

  const currentStats: QuestionStats =
    progress.questionStats[questionId] ?? {
      questionId,
      attempts: 0,
      correct: 0,
      incorrect: 0,
      currentStreak: 0,
      lastWasCorrect: null,
      lastAnsweredAt: null,
    };

  const updatedStats: QuestionStats = {
    ...currentStats,

    attempts:
      currentStats.attempts + 1,

    correct:
      currentStats.correct +
      (isCorrect ? 1 : 0),

    incorrect:
      currentStats.incorrect +
      (isCorrect ? 0 : 1),

    currentStreak:
      isCorrect
        ? currentStats.currentStreak + 1
        : 0,

    lastWasCorrect:
      isCorrect,

    lastAnsweredAt:
      new Date().toISOString(),
  };

  progress.questionStats[questionId] =
    updatedStats;

  saveProgress(progress);

  return updatedStats;
}

export function saveQuizHistory(
  item: QuizHistoryItem,
): void {
  const progress = loadProgress();

  progress.history.unshift(item);

  const MAX_HISTORY_ITEMS = 200;

  if (progress.history.length > MAX_HISTORY_ITEMS) {
    progress.history =
      progress.history.slice(
        0,
        MAX_HISTORY_ITEMS,
      );
  }

  saveProgress(progress);
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(
      "No fue posible eliminar el progreso:",
      error,
    );
  }
}