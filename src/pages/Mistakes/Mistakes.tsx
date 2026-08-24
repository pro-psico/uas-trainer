import {
  useMemo,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getQuestionBank,
} from "../../services/quizEngine";

import {
  loadProgress,
} from "../../services/storageService";

import {
  getWeakQuestions,
} from "../../services/statsService";

import "./Mistakes.css";

const TRAINING_LIMIT =
  30;

export function Mistakes() {
  const weakQuestions =
    useMemo(
      () => {
        const questions =
          getQuestionBank();

        const progress =
          loadProgress();

        return getWeakQuestions(
          questions,
          progress,
        );
      },
      [],
    );

  const totalMistakes =
    weakQuestions.length;

  const trainingQuestions =
    Math.min(
      totalMistakes,
      TRAINING_LIMIT,
    );

  const preview =
    weakQuestions.slice(
      0,
      5,
    );

  return (
    <main className="mistakes">
      <header className="mistakes__header">
        <Link
          to="/"
          className="mistakes__back"
          aria-label="Volver al menú"
        >
          ←
        </Link>

        <div>
          <span>
            ENTRENAMIENTO ADAPTATIVO
          </span>

          <h1>
            Mis errores
          </h1>

          <p>
            El sistema prioriza las preguntas que más te cuestan.
          </p>
        </div>
      </header>

      {totalMistakes === 0 ? (
        <section className="mistakes__empty">
          <div className="mistakes__empty-icon">
            ✓
          </div>

          <h2>
            Todavía no hay errores
          </h2>

          <p>
            Realiza un simulacro o estudia algún tema para comenzar a construir tu historial.
          </p>

          <Link
            to="/quiz"
            className="mistakes__start"
          >
            Hacer simulacro
          </Link>
        </section>
      ) : (
        <>
          <section className="mistakes__summary">
            <div>
              <strong>
                {
                  totalMistakes
                }
              </strong>

              <span>
                preguntas con errores
              </span>
            </div>

            <div>
              <strong>
                {
                  trainingQuestions
                }
              </strong>

              <span>
                próximo entrenamiento
              </span>
            </div>
          </section>

          <Link
            to="/quiz?mode=mistakes"
            className="mistakes__train"
          >
            <span className="mistakes__train-icon">
              ↻
            </span>

            <div>
              <strong>
                Entrenar mis errores
              </strong>

              <small>
                {
                  trainingQuestions
                }
                {" "}
                preguntas priorizadas
              </small>
            </div>

            <span>
              →
            </span>
          </Link>

          <section className="mistakes__ranking">
            <header>
              <span>
                PRIORIDAD
              </span>

              <h2>
                Las que más te cuestan
              </h2>
            </header>

            <div className="mistakes__ranking-list">
              {preview.map(
                (
                  item,
                  index,
                ) => {
                  const errorPercentage =
                    Math.round(
                      item.errorRate *
                        100,
                    );

                  return (
                    <article
                      key={
                        item.question
                          .id
                      }
                      className="weak-question"
                    >
                      <div className="weak-question__rank">
                        {String(
                          index +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </div>

                      <div className="weak-question__content">
                        <span>
                          {
                            item.question
                              .tema
                          }
                        </span>

                        <p>
                          {
                            item.question
                              .pregunta
                          }
                        </p>

                        <div className="weak-question__stats">
                          <strong>
                            {
                              errorPercentage
                            }
                            %
                          </strong>

                          <span>
                            de error
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {
                              item.stats
                                .incorrect
                            }
                            {" "}
                            fallos
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {
                              item.stats
                                .attempts
                            }
                            {" "}
                            intentos
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}