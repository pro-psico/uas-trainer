import type { Question } from "../types/question";
import type { QuestionStats } from "../types/progress";

interface WeightedQuestion {
  question: Question;
  weight: number;
}

function calculateQuestionWeight(
  stats?: QuestionStats,
): number {
  /*
   * =========================================
   * 1. PREGUNTA NUNCA CONTESTADA
   * =========================================
   *
   * Es nuestra prioridad principal.
   *
   * Peso 8 significa que tendrá mucha más
   * probabilidad de aparecer que una pregunta
   * ya muy practicada.
   */
  if (
    !stats ||
    stats.attempts === 0
  ) {
    return 8;
  }

  /*
   * =========================================
   * 2. BONUS POR POCOS INTENTOS
   * =========================================
   *
   * Mientras menos veces la hayas visto,
   * mayor es su peso.
   *
   * 1 intento  → +2
   * 2 intentos → +1.33
   * 4 intentos → +0.8
   * 9 intentos → +0.4
   */
  const exposureBonus =
    4 /
    (
      stats.attempts +
      1
    );

  /*
   * =========================================
   * 3. BONUS POR PORCENTAJE DE ERROR
   * =========================================
   */
  const errorRate =
    stats.incorrect /
    stats.attempts;

  const errorBonus =
    errorRate * 3;

  /*
   * =========================================
   * 4. SI LA ÚLTIMA VEZ FALLASTE
   * =========================================
   */
  const recentMistakeBonus =
    stats.lastWasCorrect ===
    false
      ? 1.25
      : 0;

  /*
   * =========================================
   * PESO FINAL
   * =========================================
   */
  return Math.max(
    1,

    1 +
      exposureBonus +
      errorBonus +
      recentMistakeBonus,
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