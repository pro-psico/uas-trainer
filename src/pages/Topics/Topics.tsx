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
  getTopicPerformance,
} from "../../services/statsService";

import "./Topics.css";

function getStatusLabel(
  status:
    | "unstarted"
    | "reinforce"
    | "progressing"
    | "strong",
): string {
  switch (status) {
    case "strong":
      return "Buen dominio";

    case "progressing":
      return "En progreso";

    case "reinforce":
      return "Necesita refuerzo";

    default:
      return "Sin iniciar";
  }
}

export function Topics() {
  const topicStats =
    useMemo(
      () => {
        const questions =
          getQuestionBank();

        const progress =
          loadProgress();

        return getTopicPerformance(
          questions,
          progress,
        );
      },
      [],
    );

  return (
    <main className="topics">
      <header className="topics__header">
        <Link
          to="/"
          className="topics__back"
          aria-label="Volver al menú"
        >
          ←
        </Link>

        <div>
          <span>
            ENTRENAMIENTO
          </span>

          <h1>
            Estudiar por tema
          </h1>

          <p>
            Completa todas las preguntas de un módulo.
          </p>
        </div>
      </header>

      <section className="topics__list">
        {topicStats.map(
          (
            topic,
            index,
          ) => {
            const topicUrl =
              `/quiz?mode=topic&topic=${encodeURIComponent(
                topic.topic,
              )}`;

            return (
              <Link
                key={
                  topic.topic
                }
                to={
                  topicUrl
                }
                className={[
                  "topic-card",
                  `topic-card--${topic.status}`,
                ].join(" ")}
              >
                <div className="topic-card__top">
                  <span className="topic-card__number">
                    {String(
                      index +
                        1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <span className="topic-card__status">
                    {getStatusLabel(
                      topic.status,
                    )}
                  </span>
                </div>

                <h2>
                  {topic.topic}
                </h2>

                <div className="topic-card__summary">
                  <span>
                    {
                      topic.totalQuestions
                    }
                    {" "}
                    preguntas
                  </span>

                  <strong>
                    {topic.accuracy}
                    %
                  </strong>
                </div>

                <div className="topic-card__progress">
                  <div
                    style={{
                      width: `${topic.coverage}%`,
                    }}
                  />
                </div>

                <div className="topic-card__metrics">
                  <div>
                    <strong>
                      {
                        topic.seenQuestions
                      }
                      /
                      {
                        topic.totalQuestions
                      }
                    </strong>

                    <span>
                      Vistas
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        topic.accuracy
                      }
                      %
                    </strong>

                    <span>
                      Precisión
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        topic.incorrect
                      }
                    </strong>

                    <span>
                      Errores
                    </span>
                  </div>
                </div>

                <div className="topic-card__action">
                  Entrenar tema
                  <span>
                    →
                  </span>
                </div>
              </Link>
            );
          },
        )}
      </section>
    </main>
  );
}