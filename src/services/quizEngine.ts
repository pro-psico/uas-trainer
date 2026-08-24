import questionBankJson from "../data/banco_preguntas_uas.json";

import type {
  Question,
  QuizQuestion,
} from "../types/question";

import {
  loadProgress,
} from "./storageService";

import {
  weightedSampleWithoutReplacement,
} from "../utils/weightedRandom";

import {
  shuffle,
} from "../utils/shuffle";

const DEFAULT_GENERAL_QUIZ_SIZE =
  50;

const DEFAULT_MISTAKES_QUIZ_SIZE =
  30;

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isQuestion(
  value: unknown,
): value is Question {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const question =
    value as Partial<Question>;

  return (
    Number.isInteger(
      question.id,
    ) &&
    typeof question.id ===
      "number" &&
    question.id > 0 &&

    isNonEmptyString(
      question.tema,
    ) &&

    Number.isInteger(
      question.numero_pregunta,
    ) &&
    typeof
      question.numero_pregunta ===
      "number" &&

    isNonEmptyString(
      question.pregunta,
    ) &&

    Array.isArray(
      question.respuestas_incorrectas,
    ) &&

    question.respuestas_incorrectas.length >
      0 &&

    question.respuestas_incorrectas.every(
      isNonEmptyString,
    ) &&

    isNonEmptyString(
      question.respuesta_correcta,
    )
  );
}

function validateQuestionBank(
  data: unknown,
): Question[] {
  if (!Array.isArray(data)) {
    throw new Error(
      "El banco de preguntas no tiene un formato válido.",
    );
  }

  const invalidIndexes:
    number[] = [];

  const ids =
    new Set<number>();

  data.forEach(
    (item, index) => {
      if (!isQuestion(item)) {
        invalidIndexes.push(
          index,
        );

        return;
      }

      if (ids.has(item.id)) {
        throw new Error(
          `ID de pregunta duplicado: ${item.id}`,
        );
      }

      ids.add(item.id);
    },
  );

  if (
    invalidIndexes.length > 0
  ) {
    throw new Error(
      `Se encontraron ${invalidIndexes.length} preguntas inválidas en el banco.`,
    );
  }

  return data as Question[];
}

const questions =
  validateQuestionBank(
    questionBankJson,
  );

function prepareQuestion(
  question: Question,
): QuizQuestion {
  const options = [
    ...question.respuestas_incorrectas,
    question.respuesta_correcta,
  ];

  const uniqueOptions =
    Array.from(
      new Set(options),
    );

  if (
    uniqueOptions.length < 2
  ) {
    throw new Error(
      `La pregunta ${question.id} no posee suficientes opciones distintas.`,
    );
  }

  return {
    ...question,

    opciones:
      shuffle(
        uniqueOptions,
      ),
  };
}

export function getQuestionBank():
  readonly Question[] {
  return questions;
}

export function getTopics():
  string[] {
  return Array.from(
    new Set(
      questions.map(
        (question) =>
          question.tema,
      ),
    ),
  );
}

export function createGeneralQuiz(
  amount =
    DEFAULT_GENERAL_QUIZ_SIZE,
): QuizQuestion[] {
  const progress =
    loadProgress();

  const validAmount =
    Math.max(
      1,
      Math.min(
        amount,
        questions.length,
      ),
    );

  const selected =
    weightedSampleWithoutReplacement(
      questions,
      progress.questionStats,
      validAmount,
    );

  return selected.map(
    prepareQuestion,
  );
}

export function createTopicQuiz(
  topic: string,
): QuizQuestion[] {
  const normalizedTopic =
    topic.trim();

  if (!normalizedTopic) {
    throw new Error(
      "Debes seleccionar un tema.",
    );
  }

  const topicQuestions =
    questions.filter(
      (question) =>
        question.tema ===
        normalizedTopic,
    );

  if (
    topicQuestions.length === 0
  ) {
    throw new Error(
      `No existen preguntas para el tema "${normalizedTopic}".`,
    );
  }

  return shuffle(
    topicQuestions,
  ).map(
    prepareQuestion,
  );
}

export function createMistakesQuiz(
  amount =
    DEFAULT_MISTAKES_QUIZ_SIZE,
): QuizQuestion[] {
  const progress =
    loadProgress();

  const mistakeQuestions =
    questions.filter(
      (question) =>
        (
          progress.questionStats[
            question.id
          ]?.incorrect ?? 0
        ) > 0,
    );

  if (
    mistakeQuestions.length === 0
  ) {
    return [];
  }

  const validAmount =
    Math.min(
      Math.max(
        1,
        amount,
      ),
      mistakeQuestions.length,
    );

  const selected =
    weightedSampleWithoutReplacement(
      mistakeQuestions,
      progress.questionStats,
      validAmount,
    );

  return selected.map(
    prepareQuestion,
  );
}

export function getMistakeCount():
  number {
  const progress =
    loadProgress();

  return questions.filter(
    (question) =>
      (
        progress.questionStats[
          question.id
        ]?.incorrect ?? 0
      ) > 0,
  ).length;
}