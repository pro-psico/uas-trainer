import {
  useCallback,
  useEffect,
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
  QuizResults,
} from "../../components/QuizResults/QuizResults";

import {
  createExamQuiz,
  createGeneralQuiz,
  createMistakesQuiz,
  createReviewQuiz,
  createTopicQuiz,
} from "../../services/quizEngine";

import {
  registerAnswer,
  saveQuizHistory,
} from "../../services/storageService";

import {
  buildExamSessionResult,
  buildSessionResult,
} from "../../services/statsService";

import type {
  QuestionAnswer,
  QuizQuestion,
} from "../../types/question";

import type {
  QuizHistoryItem,
  QuizMode,
} from "../../types/progress";

import type {
  QuizSessionResult,
} from "../../types/stats";

import "./Quiz.css";

/*
 * Duración total del modo examen.
 *
 * 45 minutos × 60 segundos = 2700 segundos.
 */
const EXAM_DURATION_SECONDS =
  45 * 60;

interface QuizConfiguration {
  mode:
    | "general"
    | "topic"
    | "mistakes"
    | "review"
    | "exam";

  title: string;

  subtitle: string;

  topic?: string;

  reviewIds?: number[];
}

/*
 * Generamos un identificador único
 * para guardar cada sesión.
 */
function createSessionId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/*
 * Convierte:
 *
 * "17,35,81"
 *
 * en:
 *
 * [17, 35, 81]
 *
 * Lo usamos para el modo:
 *
 * Repasar errores
 */
function parseQuestionIds(
  value: string | null,
): number[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((part) =>
          Number(part),
        )
        .filter(
          (id) =>
            Number.isInteger(
              id,
            ) && id > 0,
        ),
    ),
  );
}

/*
 * Formatea el tiempo del examen.
 *
 * 2700 segundos
 * ↓
 * 45:00
 */
function formatExamTime(
  seconds: number,
): string {
  const safeSeconds =
    Math.max(
      0,
      seconds,
    );

  const minutes =
    Math.floor(
      safeSeconds / 60,
    );

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(
    minutes,
  ).padStart(
    2,
    "0",
  )}:${String(
    remainingSeconds,
  ).padStart(
    2,
    "0",
  )}`;
}

/*
 * Mira los parámetros de la URL
 * para saber qué tipo de entrenamiento
 * debemos iniciar.
 *
 * Ejemplos:
 *
 * /quiz
 *
 * /quiz?mode=exam
 *
 * /quiz?mode=mistakes
 *
 * /quiz?mode=topic&topic=METEOROLOGÍA...
 */
function resolveConfiguration(
  searchParams: URLSearchParams,
): QuizConfiguration {
  const mode =
    searchParams.get(
      "mode",
    );

  /*
   * MODO POR TEMA
   */
  if (
    mode === "topic"
  ) {
    const topic =
      searchParams
        .get("topic")
        ?.trim();

    if (topic) {
      return {
        mode: "topic",

        title: topic,

        subtitle:
          "Tema completo",

        topic,
      };
    }
  }

  /*
   * MODO MIS ERRORES
   */
  if (
    mode === "mistakes"
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

  /*
   * REPASAR LOS ERRORES
   * DE UNA SESIÓN
   */
  if (
    mode === "review"
  ) {
    return {
      mode:
        "review",

      title:
        "Repaso de errores",

      subtitle:
        "Corrección inmediata",

      reviewIds:
        parseQuestionIds(
          searchParams.get(
            "ids",
          ),
        ),
    };
  }

  /*
   * ============================
   * NUEVO: MODO EXAMEN
   * ============================
   */
  if (
    mode === "exam"
  ) {
    return {
      mode:
        "exam",

      title:
        "Modo Examen",

      subtitle:
        "50 preguntas · 45 minutos",
    };
  }

  /*
   * MODO NORMAL POR DEFECTO
   */
  return {
    mode:
      "general",

    title:
      "Simulacro",

    subtitle:
      "50 preguntas",
  };
}

/*
 * Dependiendo del modo escogido,
 * generamos diferentes preguntas.
 */
function createQuestions(
  configuration:
    QuizConfiguration,
): QuizQuestion[] {
  switch (
    configuration.mode
  ) {
    /*
     * TODAS LAS PREGUNTAS
     * DE UN TEMA
     */
    case "topic":
      if (
        !configuration.topic
      ) {
        return [];
      }

      return createTopicQuiz(
        configuration.topic,
      );

    /*
     * PREGUNTAS QUE MÁS
     * HAS FALLADO
     */
    case "mistakes":
      return createMistakesQuiz(
        30,
      );

    /*
     * ERRORES DE LA SESIÓN
     * QUE ACABAS DE TERMINAR
     */
    case "review":
      return createReviewQuiz(
        configuration.reviewIds ??
          [],
      );

    /*
     * ============================
     * NUEVO: MODO EXAMEN
     * ============================
     *
     * 50 preguntas aleatorias
     * SIN ponderación.
     */
    case "exam":
      return createExamQuiz(
        50,
      );

    /*
     * SIMULACRO NORMAL
     *
     * Aquí sí tienen más peso
     * las preguntas que has fallado.
     */
    case "general":
    default:
      return createGeneralQuiz(
        50,
      );
  }
}

interface QuizSessionProps {
  searchParams:
    URLSearchParams;
}

function QuizSession({
  searchParams,
}: QuizSessionProps) {
  const navigate =
    useNavigate();

  /*
   * Determinamos qué modo estamos
   * ejecutando según la URL.
   */
  const configuration =
    useMemo(
      () =>
        resolveConfiguration(
          searchParams,
        ),
      [searchParams],
    );

  /*
   * TRUE únicamente cuando estamos
   * realizando el examen.
   */
  const isExamMode =
    configuration.mode ===
    "exam";

  /*
   * Generamos las preguntas una sola vez
   * al iniciar esta sesión.
   */
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

  /*
   * Número de pregunta actual.
   *
   * Empieza en 0 porque los arrays
   * de JavaScript empiezan en 0.
   */
  const [
    currentIndex,
    setCurrentIndex,
  ] =
    useState(0);

  /*
   * Respuesta seleccionada actualmente.
   */
  const [
    selectedAnswer,
    setSelectedAnswer,
  ] =
    useState<
      string | null
    >(null);

  /*
   * Todas las respuestas dadas
   * durante la sesión.
   */
  const [
    answers,
    setAnswers,
  ] =
    useState<
      QuestionAnswer[]
    >([]);

  /*
   * Guardamos también las respuestas
   * en un ref para disponer siempre
   * de la versión más reciente.
   */
  const answersRef =
    useRef<
      QuestionAnswer[]
    >([]);

  /*
   * Resultado cuando termina
   * el entrenamiento.
   */
  const [
    finishedResult,
    setFinishedResult,
  ] =
    useState<
      QuizSessionResult | null
    >(null);

  /*
   * ===============================
   * NUEVO: TEMPORIZADOR DEL EXAMEN
   * ===============================
   *
   * Si estamos en examen:
   *
   * 2700 segundos = 45 minutos.
   *
   * En los demás modos queda en 0.
   */
  const [
    remainingSeconds,
    setRemainingSeconds,
  ] =
    useState(
      isExamMode
        ? EXAM_DURATION_SECONDS
        : 0,
    );

  /*
   * Fecha en que comienza
   * la sesión.
   */
  const startedAt =
    useRef(
      new Date(),
    );

  /*
   * ID único de esta sesión.
   */
  const sessionId =
    useRef(
      createSessionId(),
    );

  /*
   * Evita guardar el mismo examen
   * dos veces accidentalmente.
   *
   * Por ejemplo:
   *
   * pregunta 50 terminada
   * +
   * temporizador llegando a 00:00
   */
  const finishedRef =
    useRef(false);

  /*
   * Pregunta que se está mostrando.
   */
  const currentQuestion =
    questions[
      currentIndex
    ];

  /*
   * Determina si el usuario
   * ya respondió.
   */
  const isAnswered =
    selectedAnswer !==
    null;

  /*
   * Porcentaje visual de progreso.
   */
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

  /*
   * Contador de respuestas correctas.
   *
   * IMPORTANTE:
   *
   * En examen lo calculamos igualmente,
   * pero NO lo mostramos al usuario.
   */
  const correctSoFar =
    useMemo(
      () =>
        answers.filter(
          (answer) =>
            answer.isCorrect,
        ).length,
      [answers],
    );

  /*
   * ==================================
   * TERMINAR Y GUARDAR EL ENTRENAMIENTO
   * ==================================
   */
  const finishQuiz =
    useCallback(
      (): void => {
        /*
         * Evitamos ejecuciones duplicadas.
         */
        if (
          finishedRef.current
        ) {
          return;
        }

        finishedRef.current =
          true;

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

        /*
         * Construimos el resultado.
         */
        const result =
          isExamMode
            ? buildExamSessionResult(
                questions,
                answersRef.current,
                durationSeconds,
              )
            : buildSessionResult(
                questions,
                answersRef.current,
                durationSeconds,
         );

        /*
         * Guardamos el examen
         * en localStorage.
         */
        const historyItem:
          QuizHistoryItem = {
            id:
              sessionId.current,

            mode:
              configuration.mode as QuizMode,

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
              result.total,

            correctAnswers:
              result.correct,

            incorrectAnswers:
              result.incorrect,

            percentage:
              result.percentage,

            topicBreakdown:
              result.topicBreakdown,

            failedQuestionIds:
              result.failedQuestionIds,
          };

        try {
          saveQuizHistory(
            historyItem,
          );
        } catch (error) {
          console.error(
            "No fue posible guardar la sesión:",
            error,
          );
        }

        setFinishedResult(
          result,
        );
      },
      [
        configuration,
        questions,
      ],
    );

  /*
   * ==================================
   * NUEVO: RELOJ DEL MODO EXAMEN
   * ==================================
   */
  useEffect(() => {
    /*
     * Si NO estamos en examen,
     * no hacemos absolutamente nada.
     */
    if (
      !isExamMode
    ) {
      return;
    }

    /*
     * Si el examen terminó,
     * detenemos el reloj.
     */
    if (
      finishedResult
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setRemainingSeconds(
            (previous) =>
              Math.max(
                previous - 1,
                0,
              ),
          );
        },
        1000,
      );

    /*
     * React ejecutará esto cuando
     * desmontemos el componente.
     *
     * Así evitamos dejar intervalos
     * corriendo en memoria.
     */
    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    isExamMode,
    finishedResult,
  ]);

  /*
   * ==================================
   * ENTREGA AUTOMÁTICA EN 00:00
   * ==================================
   */
  useEffect(() => {
    if (
      !isExamMode
    ) {
      return;
    }

    if (
      remainingSeconds >
      0
    ) {
      return;
    }

    if (
      finishedResult
    ) {
      return;
    }

    finishQuiz();
  }, [
    isExamMode,
    remainingSeconds,
    finishedResult,
    finishQuiz,
  ]);

  /*
   * ==================================
   * RESPONDER UNA PREGUNTA
   * ==================================
   */
  function handleAnswer(
    answer: string,
  ): void {
    /*
     * No permitimos responder dos veces.
     */
    if (
      !currentQuestion ||
      isAnswered
    ) {
      return;
    }

    const isCorrect =
      answer ===
      currentQuestion.respuesta_correcta;

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

    /*
     * Creamos la lista actualizada
     * de respuestas.
     */
    const updatedAnswers = [
      ...answersRef.current,
      answerRecord,
    ];

    /*
     * Actualizamos el REF.
     */
    answersRef.current =
      updatedAnswers;

    /*
     * Actualizamos el estado visual.
     */
    setAnswers(
      updatedAnswers,
    );

    setSelectedAnswer(
      answer,
    );

    /*
     * Guardamos estadística individual.
     *
     * Incluso en Modo Examen queremos
     * que posteriormente la app aprenda
     * qué preguntas fallaste.
     */
    try {
      registerAnswer(
        currentQuestion.id,
        isCorrect,
      );
    } catch (error) {
      console.error(
        "No fue posible registrar la respuesta:",
        error,
      );
    }
  }

  /*
   * ==================================
   * PASAR A LA SIGUIENTE PREGUNTA
   * ==================================
   */
  function handleNext():
    void {
    /*
     * No permitimos avanzar
     * sin haber contestado.
     */
    if (
      !isAnswered
    ) {
      return;
    }

    const isLastQuestion =
      currentIndex ===
      questions.length -
        1;

    /*
     * Si estamos en la última,
     * terminamos la sesión.
     */
    if (
      isLastQuestion
    ) {
      finishQuiz();

      return;
    }

    /*
     * Siguiente pregunta.
     */
    setCurrentIndex(
      (previous) =>
        previous + 1,
    );

    /*
     * Eliminamos la respuesta
     * seleccionada visualmente.
     */
    setSelectedAnswer(
      null,
    );
  }

  /*
   * ==================================
   * REINICIAR ENTRENAMIENTO
   * ==================================
   */
  function restartQuiz():
    void {
    try {
      /*
       * Generamos preguntas nuevas.
       */
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

      answersRef.current =
        [];

      setFinishedResult(
        null,
      );

      /*
       * Reiniciamos la protección
       * contra doble finalización.
       */
      finishedRef.current =
        false;

      /*
       * Nueva fecha de inicio.
       */
      startedAt.current =
        new Date();

      /*
       * Nueva sesión.
       */
      sessionId.current =
        createSessionId();

      /*
       * Si es examen:
       *
       * vuelve a 45:00.
       */
      setRemainingSeconds(
        isExamMode
          ? EXAM_DURATION_SECONDS
          : 0,
      );
    } catch (error) {
      console.error(
        "No fue posible reiniciar el entrenamiento:",
        error,
      );
    }
  }

  /*
   * ==================================
   * REPASAR ERRORES
   * ==================================
   */
  function reviewMistakes(
    ids: number[],
  ): void {
    if (
      ids.length === 0
    ) {
      return;
    }

    const query =
      ids.join(",");

    navigate(
      `/quiz?mode=review&ids=${encodeURIComponent(
        query,
      )}`,
    );
  }

  /*
   * ==================================
   * PANTALLA DE RESULTADOS
   * ==================================
   */
  if (
    finishedResult
  ) {
    return (
      <QuizResults
        title={
          configuration.title
        }
        result={
          finishedResult
        }
        onRestart={
          restartQuiz
        }
        onHome={() =>
          navigate("/")
        }
        onReviewMistakes={
          reviewMistakes
        }
      />
    );
  }

  /*
   * ==================================
   * ERROR: NO HAY PREGUNTAS
   * ==================================
   */
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
              ? "Todavía no tienes errores registrados."
              : configuration.mode ===
                  "review"
                ? "No se encontraron preguntas para repasar."
                : "No fue posible generar este entrenamiento."}
          </p>

          <Link to="/">
            Volver al menú
          </Link>
        </section>
      </main>
    );
  }

  /*
   * ==================================
   * INTERFAZ PRINCIPAL DEL QUIZ
   * ==================================
   */
  return (
    <main className="quiz">
      <header className="quiz__header">
        {/*
         * BOTÓN PARA SALIR
         */}
        <button
          type="button"
          className="quiz__exit"
          onClick={() =>
            navigate(-1)
          }
          aria-label="Salir"
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

        {/*
         * NOMBRE DEL MODO
         */}
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

        {/*
         * ==================================
         * EXAMEN:
         * mostramos reloj.
         *
         * ENTRENAMIENTO:
         * mostramos aciertos.
         * ==================================
         */}
        {isExamMode ? (
          <div
            className={[
              "quiz__timer",

              /*
               * Cuando quedan 5 minutos,
               * el reloj cambia de estilo.
               */
              remainingSeconds <=
              300
                ? "quiz__timer--danger"
                : "",
            ]
              .filter(
                Boolean,
              )
              .join(" ")}
          >
            <span>
              TIEMPO
            </span>

            <strong>
              {formatExamTime(
                remainingSeconds,
              )}
            </strong>
          </div>
        ) : (
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
        )}
      </header>

      {/*
       * ==================================
       * BARRA DE PROGRESO
       * ==================================
       */}
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

      {/*
       * ==================================
       * TARJETA PRINCIPAL
       * ==================================
       */}
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

          /*
           * ===============================
           * CLAVE DEL MODO EXAMEN
           * ===============================
           *
           * Simulacro:
           * revealFeedback = true
           *
           * Examen:
           * revealFeedback = false
           *
           * De esta forma el examen NO
           * muestra correcto/incorrecto.
           */
          revealFeedback={
            !isExamMode
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

/*
 * ========================================
 * COMPONENTE PRINCIPAL
 * ========================================
 */
export function Quiz() {
  const [
    searchParams,
  ] =
    useSearchParams();

  /*
   * Cada combinación de parámetros
   * representa una sesión diferente.
   *
   * Ejemplo:
   *
   * /quiz
   *
   * versus
   *
   * /quiz?mode=exam
   */
  const sessionKey =
    searchParams.toString() ||
    "general";

  return (
    <QuizSession
      key={
        sessionKey
      }
      searchParams={
        searchParams
      }
    />
  );
}