import type {
  QuizSessionResult,
} from "../../types/stats";

import "./QuizResults.css";



interface QuizResultsProps {
  title: string;

  result:
    QuizSessionResult;

  onRestart:
    () => void;

  onHome:
    () => void;

  onReviewMistakes:
    (
      questionIds:
        number[],
    ) => void;
}

function formatDuration(
  seconds: number,
): string {
  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remaining =
    seconds % 60;

  return `${minutes}:${String(
    remaining,
  ).padStart(
    2,
    "0",
  )}`;
}

function getResultMessage(
  percentage: number,
): string {
  if (
    percentage >= 90
  ) {
    return "Excelente dominio";
  }

  if (
    percentage >= 80
  ) {
    return "Muy buen resultado";
  }

  if (
    percentage >= 70
  ) {
    return "Buen progreso";
  }

  if (
    percentage >= 60
  ) {
    return "Hay que reforzar";
  }

  return "Tenemos trabajo por delante";
}

export function QuizResults({
  title,
  result,
  onRestart,
  onHome,
  onReviewMistakes,
}: QuizResultsProps) {
  const sortedTopics =
    [...result.topicBreakdown]
      .sort(
        (a, b) =>
          b.percentage -
          a.percentage,
      );

  const strongest =
    sortedTopics[0];

  const weakest =
    sortedTopics.length >
    1
      ? sortedTopics[
          sortedTopics.length -
            1
        ]
      : null;

  return (
    <main className="results">
      <section className="results__container">
        <header className="results__header">
          <span>
            ENTRENAMIENTO COMPLETADO
          </span>

          <h1>
            {title}
          </h1>

          <p>
            {getResultMessage(
              result.percentage,
            )}
          </p>
        </header>

        <section className="results__score">
          <div className="results__score-main">
            <strong>
              {result.correct}
              /
              {result.total}
            </strong>

            <span>
              {
                result.percentage
              }
              %
            </span>
          </div>

          <div className="results__score-bar">
            <div
              style={{
                width: `${result.percentage}%`,
              }}
            />
          </div>
        </section>

        <section className="results__metrics">
          <div>
            <strong>
              {
                result.correct
              }
            </strong>

            <span>
              Correctas
            </span>
          </div>

          <div>
            <strong>
              {
                result.incorrect
              }
            </strong>

            <span>
              Incorrectas
            </span>
          </div>

          <div>
            <strong>
              {formatDuration(
                result.durationSeconds,
              )}
            </strong>

            <span>
              Tiempo
            </span>
          </div>
        </section>

        {result.topicBreakdown
          .length > 0 && (
          <section className="results__topics">
            <header>
              <span>
                RENDIMIENTO
              </span>

              <h2>
                Por tema
              </h2>
            </header>

            <div className="results__topic-list">
              {result.topicBreakdown
                .sort(
                  (
                    a,
                    b,
                  ) =>
                    a.topic.localeCompare(
                      b.topic,
                    ),
                )
                .map(
                  (
                    topic,
                  ) => (
                    <article
                      key={
                        topic.topic
                      }
                      className="results-topic"
                    >
                      <div className="results-topic__header">
                        <strong>
                          {
                            topic.topic
                          }
                        </strong>

                        <span>
                          {
                            topic.percentage
                          }
                          %
                        </span>
                      </div>

                      <div className="results-topic__bar">
                        <div
                          style={{
                            width: `${topic.percentage}%`,
                          }}
                        />
                      </div>

                      <small>
                        {
                          topic.correct
                        }
                        /
                        {
                          topic.total
                        }
                        {" "}
                        correctas
                      </small>
                    </article>
                  ),
                )}
            </div>
          </section>
        )}

        {strongest && (
          <section className="results__insights">
            <article className="result-insight result-insight--strong">
              <span>
                TU FORTALEZA
              </span>

              <strong>
                {
                  strongest.topic
                }
              </strong>

              <small>
                {
                  strongest.percentage
                }
                % de precisión
              </small>
            </article>

            {weakest && (
              <article className="result-insight result-insight--weak">
                <span>
                  NECESITAS REFORZAR
                </span>

                <strong>
                  {
                    weakest.topic
                  }
                </strong>

                <small>
                  {
                    weakest.percentage
                  }
                  % de precisión
                </small>
              </article>
            )}
          </section>
        )}

        <section className="results__actions">
          {result.failedQuestionIds
            .length > 0 && (
            <button
              type="button"
              className="results__review"
              onClick={() =>
                onReviewMistakes(
                  result.failedQuestionIds,
                )
              }
            >
              Repasar mis{" "}
              {
                result
                  .failedQuestionIds
                  .length
              }
              {" "}
              errores
            </button>
          )}

          <button
            type="button"
            className="results__primary"
            onClick={
              onRestart
            }
          >
            Nuevo intento
          </button>

          <button
            type="button"
            className="results__secondary"
            onClick={
              onHome
            }
          >
            Menú principal
          </button>
        </section>
      </section>
    </main>
  );
}