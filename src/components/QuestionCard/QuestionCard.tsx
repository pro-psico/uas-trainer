import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type {
  QuizQuestion,
} from "../../types/question";

import "./QuestionCard.css";

interface QuestionCardProps {
  question: QuizQuestion;
  currentNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  isAnswered: boolean;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}

const SWIPE_THRESHOLD = 95;

export function QuestionCard({
  question,
  currentNumber,
  totalQuestions,
  selectedAnswer,
  isAnswered,
  onAnswer,
  onNext,
}: QuestionCardProps) {
  const [
    dragX,
    setDragX,
  ] = useState(0);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    isExiting,
    setIsExiting,
  ] = useState(false);

  const [
    exitDirection,
    setExitDirection,
  ] = useState<"left" | "right" | null>(
    null,
  );

  const dragStartX =
    useRef<number | null>(null);

  const pointerId =
    useRef<number | null>(null);

  const isCorrect =
    selectedAnswer ===
    question.respuesta_correcta;

  useEffect(() => {
    setDragX(0);
    setIsDragging(false);
    setIsExiting(false);
    setExitDirection(null);

    dragStartX.current = null;
    pointerId.current = null;
  }, [question.id]);

  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      !isAnswered ||
      isExiting
    ) {
      return;
    }

    dragStartX.current =
      event.clientX;

    pointerId.current =
      event.pointerId;

    setIsDragging(true);

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      !isDragging ||
      dragStartX.current === null ||
      pointerId.current !==
        event.pointerId
    ) {
      return;
    }

    const movement =
      event.clientX -
      dragStartX.current;

    setDragX(movement);
  }

  function handlePointerUp(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      !isDragging ||
      dragStartX.current === null
    ) {
      return;
    }

    try {
      if (
        event.currentTarget.hasPointerCapture(
          event.pointerId,
        )
      ) {
        event.currentTarget.releasePointerCapture(
          event.pointerId,
        );
      }
    } catch {
      // Algunos navegadores pueden liberar
      // el puntero automáticamente.
    }

    setIsDragging(false);

    const shouldSwipe =
      Math.abs(dragX) >=
      SWIPE_THRESHOLD;

    if (!shouldSwipe) {
      setDragX(0);

      dragStartX.current = null;
      pointerId.current = null;

      return;
    }

    const direction =
      dragX > 0
        ? "right"
        : "left";

    triggerExit(direction);
  }

  function handlePointerCancel() {
    setIsDragging(false);
    setDragX(0);

    dragStartX.current = null;
    pointerId.current = null;
  }

  function triggerExit(
    direction: "left" | "right",
  ) {
    if (
      !isAnswered ||
      isExiting
    ) {
      return;
    }

    setExitDirection(direction);
    setIsExiting(true);

    window.setTimeout(() => {
      onNext();
    }, 280);
  }

  function handleNextButton() {
    triggerExit("right");
  }

  const rotation =
    Math.max(
      -10,
      Math.min(
        10,
        dragX / 18,
      ),
    );

  const dragOpacity =
    Math.min(
      Math.abs(dragX) /
        SWIPE_THRESHOLD,
      1,
    );

  const cardStyle = {
    "--drag-x": `${dragX}px`,
    "--drag-rotation": `${rotation}deg`,
    "--drag-opacity": dragOpacity,
  } as React.CSSProperties;

  return (
    <div className="question-card-stage">
      <div
        className={[
          "question-card-dragger",
          isDragging
            ? "question-card-dragger--dragging"
            : "",
          isExiting
            ? `question-card-dragger--exit-${exitDirection}`
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={cardStyle}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
      >
        <div
          className={[
            "question-card",
            isAnswered
              ? "question-card--flipped"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <section className="question-card__face question-card__front">
            <header className="question-card__header">
              <span className="question-card__counter">
                {String(
                  currentNumber,
                ).padStart(
                  2,
                  "0",
                )}
                {" / "}
                {String(
                  totalQuestions,
                ).padStart(
                  2,
                  "0",
                )}
              </span>

              <span className="question-card__topic">
                {question.tema}
              </span>
            </header>

            <div className="question-card__body">
              <span className="question-card__number">
                PREGUNTA{" "}
                {
                  question.numero_pregunta
                }
              </span>

              <h2>
                {
                  question.pregunta
                }
              </h2>

              <div className="question-card__answers">
                {question.opciones.map(
                  (
                    option,
                    index,
                  ) => (
                    <button
                      key={`${question.id}-${option}`}
                      type="button"
                      className="answer-option"
                      onClick={() =>
                        onAnswer(
                          option,
                        )
                      }
                      disabled={
                        isAnswered
                      }
                    >
                      <span className="answer-option__letter">
                        {String.fromCharCode(
                          65 +
                            index,
                        )}
                      </span>

                      <span className="answer-option__text">
                        {option}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>

            <footer className="question-card__hint">
              Selecciona una respuesta
            </footer>
          </section>

          <section
            className={[
              "question-card__face",
              "question-card__back",
              isCorrect
                ? "question-card__back--correct"
                : "question-card__back--incorrect",
            ].join(" ")}
          >
            <div className="feedback">
              <div
                className={[
                  "feedback__icon",
                  isCorrect
                    ? "feedback__icon--correct"
                    : "feedback__icon--incorrect",
                ].join(" ")}
                aria-hidden="true"
              >
                {isCorrect ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="36"
                    height="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="36"
                    height="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 6l12 12" />
                    <path d="M18 6 6 18" />
                  </svg>
                )}
              </div>

              <span className="feedback__eyebrow">
                RESULTADO
              </span>

              <h2>
                {isCorrect
                  ? "Correcto"
                  : "Incorrecto"}
              </h2>

              <div className="feedback__answers">
                <div className="feedback-answer">
                  <span>
                    Tu respuesta
                  </span>

                  <strong>
                    {
                      selectedAnswer
                    }
                  </strong>
                </div>

                {!isCorrect && (
                  <div className="feedback-answer feedback-answer--correct">
                    <span>
                      Respuesta correcta
                    </span>

                    <strong>
                      {
                        question.respuesta_correcta
                      }
                    </strong>
                  </div>
                )}

                {isCorrect && (
                  <div className="feedback-answer feedback-answer--correct">
                    <span>
                      Respuesta correcta
                    </span>

                    <strong>
                      {
                        question.respuesta_correcta
                      }
                    </strong>
                  </div>
                )}
              </div>

              <div className="feedback__swipe">
                <div className="feedback__swipe-track">
                  <span>
                    ←
                  </span>

                  <span>
                    DESLIZA
                  </span>

                  <span>
                    →
                  </span>
                </div>

                <small>
                  para continuar
                </small>
              </div>

              <button
                type="button"
                className="feedback__next"
                onClick={
                  handleNextButton
                }
              >
                Siguiente pregunta
                <span aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </section>
        </div>

        {isAnswered && (
          <>
            <div
              className="swipe-indicator swipe-indicator--left"
              style={{
                opacity:
                  dragX < 0
                    ? dragOpacity
                    : 0,
              }}
            >
              SIGUIENTE
            </div>

            <div
              className="swipe-indicator swipe-indicator--right"
              style={{
                opacity:
                  dragX > 0
                    ? dragOpacity
                    : 0,
              }}
            >
              SIGUIENTE
            </div>
          </>
        )}
      </div>
    </div>
  );
}