import type { Question } from "../types/question";
import type { QuestionStats } from "../types/progress";

interface WeightedQuestion {
  question: Question;
  weight: number;
}

function calculateQuestionWeight(
  stats?: QuestionStats,
): number {
  if (!stats || stats.attempts === 0) {
    return 1;
  }

  const errorRate =
    stats.incorrect / stats.attempts;

  const errorWeight =
    errorRate * 3;

  const lastAnswerPenalty =
    stats.lastWasCorrect === false
      ? 1.25
      : 0;

  const streakReduction =
    Math.min(
      stats.currentStreak * 0.1,
      0.5,
    );

  return Math.max(
    1,
    1 +
      errorWeight +
      lastAnswerPenalty -
      streakReduction,
  );
}

export function weightedSampleWithoutReplacement(
  questions: readonly Question[],
  stats: Record<number, QuestionStats>,
  amount: number,
): Question[] {
  if (amount <= 0) {
    return [];
  }

  if (amount >= questions.length) {
    return [...questions];
  }

  const pool: WeightedQuestion[] =
    questions.map((question) => ({
      question,
      weight: calculateQuestionWeight(
        stats[question.id],
      ),
    }));

  const selected: Question[] = [];

  while (
    selected.length < amount &&
    pool.length > 0
  ) {
    const totalWeight =
      pool.reduce(
        (sum, item) =>
          sum + item.weight,
        0,
      );

    let random =
      Math.random() * totalWeight;

    let selectedIndex = 0;

    for (
      let index = 0;
      index < pool.length;
      index += 1
    ) {
      random -= pool[index].weight;

      if (random <= 0) {
        selectedIndex = index;
        break;
      }
    }

    const [chosen] =
      pool.splice(selectedIndex, 1);

    selected.push(chosen.question);
  }

  return selected;
}