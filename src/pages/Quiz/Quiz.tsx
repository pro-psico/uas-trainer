import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  QuestionCard,
} from "../../components/QuestionCard/QuestionCard";

import {
  createGeneralQuiz,
  createMistakesQuiz,
  createTopicQuiz,
} from "../../services/quizEngine";

import {
  registerAnswer,
  saveQuizHistory,
} from "../../services/storageService";

import type {
  QuestionAnswer,
  QuizQuestion,
} from "../../types/question";

import type {
  QuizHistoryItem,
} from "../../types/progress";

import "./Quiz.css";

type QuizMode =
  | "general"
  | "topic"
  | "mistakes";

interface QuizConfiguration {
  mode: QuizMode;
  title: string;
  subtitle: string;
  topic?: string;
}

interface QuizResult {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
  durationSeconds: number;
}

function createSessionId():
  string {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function resolveConfiguration(
  modeParameter: string | null,
  topicParameter: string | null,
): QuizConfiguration {
  if (
    modeParameter ===
      "topic" &&
    topicParameter?.trim()
  ) {
    return {
      mode: "topic",

      title:
        topicParameter,

      subtitle:
        "Tema completo",

      topic:
        topicParameter,
    };
  }

  if (
    modeParameter ===
    "mistakes"
  ) {
    return {
      mode:
        "mistakes",

      title:
        "Mis errores",

      subtitle:
        "Entrenamiento adaptativo",
    };
  }

  return {
    mode:
      "general",

    title:
      "Simulacro",

    subtitle:
      "50 preguntas",
  };
}

function createQuestions(
  configuration:
    QuizConfiguration,
): QuizQuestion[] {
  switch (
    configuration.mode
  ) {
    case "topic":
      if (
        !configuration.topic
      ) {
        throw new Error(
          "No se indicó el tema del entrenamiento.",
        );
      }

      return createTopicQuiz(
        configuration.topic,
      );

    case "mistakes":
      return createMistakesQuiz(
        30,
      );

    case "general":
    default:
      return createGeneralQuiz(
        50,
      );
  }
}

function formatDuration(
  seconds: number,
): string {
  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remainingSeconds =
    seconds % 60;

  return `${minutes}:${String(
    remainingSeconds,
  ).padStart(
    2,
    "0",
  )}`;
}

export function Quiz() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const configuration =
    useMemo(
      () =>
        resolveConfiguration(
          searchParams.get(
            "mode",
          ),
          searchParams.get(
            "topic",
          ),
        ),
      [searchParams],
    );

  const [
    questions,
    setQuestions,
  ] =
    useState<
      QuizQuestion[]
    >(
      () =>
        createQuestions(
          configuration,
        ),
    );

  const [
    currentIndex,
    setCurrentIndex,
  ] =
    useState(0);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] =
    useState<
      string | null
    >(null);

  const [
    answers,
    setAnswers,
  ] =
    useState<
      QuestionAnswer[]
    >([]);

  const [
    finishedResult,
    setFinishedResult,
  ] =
    useState<
      QuizResult | null
    >(null);

  const startedAt =
    useRef(
      new Date(),
    );

  const sessionId =
    useRef(
      createSessionId(),
    );

  const currentQuestion =
    questions[
      currentIndex
    ];

  const isAnswered =
    selectedAnswer !==
    null;

  const progress =
    questions.length > 0
      ? (
          (
            currentIndex +
            1
          ) /
          questions.length
        ) *
        100
      : 0;

  const correctSoFar =
    useMemo(
      () =>
        answers.filter(
          (answer) =>
            answer.isCorrect,
        ).length,
      [answers],
    );

  function handleAnswer(
    answer: string,
  ): void {
    if (
      !currentQuestion ||
      isAnswered
    ) {
      return;
    }

    const isCorrect =
      answer ===
      currentQuestion.respuesta_correcta;

    try {
      registerAnswer(
        currentQuestion.id,
        isCorrect,
      );
    } catch (error) {
      console.error(
        "No se pudo registrar la respuesta:",
        error,
      );
    }

    const answerRecord:
      QuestionAnswer = {
        questionId:
          currentQuestion.id,

        selectedAnswer:
          answer,

        correctAnswer:
          currentQuestion.respuesta_correcta,

        isCorrect,

        answeredAt:
          new Date()
            .toISOString(),
      };

    setAnswers(
      (previous) => [
        ...previous,
        answerRecord,
      ],
    );

    setSelectedAnswer(
      answer,
    );
  }

  function finishQuiz(
    finalAnswers:
      QuestionAnswer[],
  ): void {
    const finishedAt =
      new Date();

    const durationSeconds =
      Math.max(
        1,
        Math.round(
          (
            finishedAt.getTime() -
            startedAt.current.getTime()
          ) /
            1000,
        ),
      );

    const correct =
      finalAnswers.filter(
        (answer) =>
          answer.isCorrect,
      ).length;

    const total =
      finalAnswers.length;

    const incorrect =
      total -
      correct;

    const percentage =
      total > 0
        ? Math.round(
            (
              correct /
              total
            ) *
              100,
          )
        : 0;

    const result:
      QuizResult = {
        total,
        correct,
        incorrect,
        percentage,
        durationSeconds,
      };

    const historyItem:
      QuizHistoryItem = {
        id:
          sessionId.current,

        mode:
          configuration.mode,

        ...(configuration.topic
          ? {
              topic:
                configuration.topic,
            }
          : {}),

        startedAt:
          startedAt.current.toISOString(),

        finishedAt:
          finishedAt.toISOString(),

        durationSeconds,

        totalQuestions:
          total,

        correctAnswers:
          correct,

        incorrectAnswers:
          incorrect,

        percentage,
      };

    try {
      saveQuizHistory(
        historyItem,
      );
    } catch (error) {
      console.error(
        "No se pudo guardar el historial:",
        error,
      );
    }

    setFinishedResult(
      result,
    );
  }

  function handleNext():
    void {
    if (
      !isAnswered ||
      !currentQuestion
    ) {
      return;
    }

    const isLastQuestion =
      currentIndex ===
      questions.length -
        1;

    if (
      isLastQuestion
    ) {
      /*
       * Usamos answers directamente porque
       * la respuesta ya fue registrada al
       * seleccionar la opción.
       */
      finishQuiz(
        answers,
      );

      return;
    }

    setCurrentIndex(
      (previous) =>
        previous + 1,
    );

    setSelectedAnswer(
      null,
    );
  }

  function restartQuiz():
    void {
    try {
      const newQuestions =
        createQuestions(
          configuration,
        );

      setQuestions(
        newQuestions,
      );

      setCurrentIndex(0);
      setSelectedAnswer(
        null,
      );
      setAnswers([]);
      setFinishedResult(
        null,
      );

      startedAt.current =
        new Date();

      sessionId.current =
        createSessionId();
    } catch (error) {
      console.error(
        "No fue posible reiniciar el entrenamiento:",
        error,
      );
    }
  }

  if (
    finishedResult
  ) {
    return (
      <main className="quiz-result">
        <section className="quiz-result__card">
          <span className="quiz-result__eyebrow">
            ENTRENAMIENTO COMPLETADO
          </span>

          <div className="quiz-result__score">
            <strong>
              {
                finishedResult.correct
              }
              /
              {
                finishedResult.total
              }
            </strong>

            <span>
              {
                finishedResult.percentage
              }
              %
            </span>
          </div>

          <h1>
            {
              configuration.title
            }
          </h1>

          <div className="quiz-result__metrics">
            <div>
              <strong>
                {
                  finishedResult.correct
                }
              </strong>

              <span>
                Correctas
              </span>
            </div>

            <div>
              <strong>
                {
                  finishedResult.incorrect
                }
              </strong>

              <span>
                Incorrectas
              </span>
            </div>

            <div>
              <strong>
                {formatDuration(
                  finishedResult.durationSeconds,
                )}
              </strong>

              <span>
                Tiempo
              </span>
            </div>
          </div>

          <p>
            Tus respuestas ya fueron incorporadas a las estadísticas y al sistema de priorización.
          </p>

          <div className="quiz-result__actions">
            <button
              type="button"
              onClick={
                restartQuiz
              }
            >
              Repetir entrenamiento
            </button>

            <button
              type="button"
              className="quiz-result__secondary"
              onClick={() =>
                navigate("/")
              }
            >
              Menú principal
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (
    !currentQuestion
  ) {
    return (
      <main className="quiz-error">
        <section>
          <h1>
            No hay preguntas
          </h1>

          <p>
            {configuration.mode ===
            "mistakes"
              ? "Todavía no tienes preguntas incorrectas registradas."
              : "No fue posible generar este entrenamiento."}
          </p>

          <Link to="/">
            Volver al menú
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="quiz">
      <header className="quiz__header">
        <button
          type="button"
          className="quiz__exit"
          onClick={() =>
            navigate(-1)
          }
          aria-label="Salir del entrenamiento"
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="quiz__title">
          <span>
            {
              configuration.subtitle
            }
          </span>

          <strong>
            {
              configuration.title
            }
          </strong>
        </div>

        <div className="quiz__score">
          <span>
            ACIERTOS
          </span>

          <strong>
            {
              correctSoFar
            }
          </strong>
        </div>
      </header>

      <section className="quiz__progress">
        <div className="quiz__progress-info">
          <span>
            Pregunta{" "}
            {currentIndex +
              1}
            {" / "}
            {
              questions.length
            }
          </span>

          <span>
            {
              Math.round(
                progress,
              )
            }
            %
          </span>
        </div>

        <div className="quiz__progress-track">
          <div
            className="quiz__progress-bar"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </section>

      <section className="quiz__card-area">
        <QuestionCard
          question={
            currentQuestion
          }
          currentNumber={
            currentIndex +
            1
          }
          totalQuestions={
            questions.length
          }
          selectedAnswer={
            selectedAnswer
          }
          isAnswered={
            isAnswered
          }
          onAnswer={
            handleAnswer
          }
          onNext={
            handleNext
          }
        />
      </section>
    </main>
  );
}