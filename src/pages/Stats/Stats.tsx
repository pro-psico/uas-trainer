import {
  useMemo,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  EvolutionChart,
} from "../../components/EvolutionChart/EvolutionChart";

import {
  getQuestionBank,
} from "../../services/quizEngine";

import {
  loadProgress,
} from "../../services/storageService";

import {
  getEvolutionData,
  getOverallPerformance,
  getTopicPerformance,
} from "../../services/statsService";

import type {
  PreparationStatus,
} from "../../types/stats";

import "./Stats.css";

function getPreparationLabel(
  status:
    PreparationStatus,
): string {
  switch (status) {
    case "ready":
      return "Muy buen nivel";

    case "strong":
      return "Buen nivel";

    case "progressing":
      return "En desarrollo";

    default:
      return "Fase inicial";
  }
}

export function Stats() {
  const data =
    useMemo(
      () => {
        const questions =
          getQuestionBank();

        const progress =
          loadProgress();

        const overall =
          getOverallPerformance(
            questions,
            progress,
          );

        const topics =
          getTopicPerformance(
            questions,
            progress,
          );

        const evolution =
          getEvolutionData(
            progress.history,
            10,
          );

        return {
          overall,
          topics,
          evolution,
        };
      },
      [],
    );

  const studiedTopics =
    data.topics.filter(
      (topic) =>
        topic.attempts >
        0,
    );

  const strongest =
    [...studiedTopics].sort(
      (a, b) =>
        b.accuracy -
        a.accuracy,
    )[0];

  const weakest =
    [...studiedTopics].sort(
      (a, b) =>
        a.accuracy -
        b.accuracy,
    )[0];

  return (
    <main className="stats-page">
      <header className="stats-page__header">
        <Link
          to="/"
          className="stats-page__back"
        >
          ←
        </Link>

        <div>
          <span>
            ANALYTICS
          </span>

          <h1>
            Estadísticas
          </h1>

          <p>
            Tu progreso acumulado en este dispositivo.
          </p>
        </div>
      </header>

      <section className="readiness">
        <span className="readiness__eyebrow">
          ÍNDICE DE PREPARACIÓN
        </span>

        <div className="readiness__score">
          <strong>
            {
              data.overall
                .preparationIndex
            }
          </strong>

          <span>
            %
          </span>
        </div>

        <p>
          {getPreparationLabel(
            data.overall.status,
          )}
        </p>

        <div className="readiness__bar">
          <div
            style={{
              width: `${data.overall.preparationIndex}%`,
            }}
          />
        </div>

        <small>
          Combina precisión y cobertura del banco. No representa una probabilidad de aprobar.
        </small>
      </section>

      <section className="stats-overview">
        <article>
          <strong>
            {
              data.overall
                .accuracy
            }
            %
          </strong>

          <span>
            Precisión
          </span>
        </article>

        <article>
          <strong>
            {
              data.overall
                .coverage
            }
            %
          </strong>

          <span>
            Cobertura
          </span>
        </article>

        <article>
          <strong>
            {
              data.overall
                .studiedQuestions
            }
            /
            {
              data.overall
                .totalQuestions
            }
          </strong>

          <span>
            Estudiadas
          </span>
        </article>

        <article>
          <strong>
            {
              data.overall
                .attempts
            }
          </strong>

          <span>
            Respuestas
          </span>
        </article>
      </section>

      {(strongest ||
        weakest) && (
        <section className="stats-insights">
          {strongest && (
            <article>
              <span>
                FORTALEZA
              </span>

              <strong>
                {
                  strongest.topic
                }
              </strong>

              <small>
                {
                  strongest.accuracy
                }
                % precisión
              </small>
            </article>
          )}

          {weakest && (
            <article className="stats-insights__weak">
              <span>
                A REFORZAR
              </span>

              <strong>
                {
                  weakest.topic
                }
              </strong>

              <small>
                {
                  weakest.accuracy
                }
                % precisión
              </small>
            </article>
          )}
        </section>
      )}

      <section className="stats-section">
        <header>
          <span>
            EVOLUCIÓN
          </span>

          <h2>
            Últimos simulacros
          </h2>
        </header>

        <div className="stats-chart-card">
          <EvolutionChart
            points={
              data.evolution
            }
          />
        </div>
      </section>

      <section className="stats-section">
        <header>
          <span>
            DOMINIO
          </span>

          <h2>
            Por tema
          </h2>
        </header>

        <div className="stats-topics">
          {data.topics.map(
            (topic) => (
              <article
                key={
                  topic.topic
                }
                className="stats-topic"
              >
                <div className="stats-topic__header">
                  <div>
                    <strong>
                      {
                        topic.topic
                      }
                    </strong>

                    <small>
                      {
                        topic.seenQuestions
                      }
                      /
                      {
                        topic.totalQuestions
                      }
                      {" "}
                      estudiadas
                    </small>
                  </div>

                  <span>
                    {
                      topic.accuracy
                    }
                    %
                  </span>
                </div>

                <div className="stats-topic__bar">
                  <div
                    style={{
                      width: `${topic.accuracy}%`,
                    }}
                  />
                </div>

                <div className="stats-topic__footer">
                  <span>
                    Cobertura{" "}
                    {
                      topic.coverage
                    }
                    %
                  </span>

                  <span>
                    {
                      topic.incorrect
                    }
                    {" "}
                    errores
                  </span>
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="stats-page__actions">
        <Link to="/mistakes">
          Entrenar mis errores
        </Link>

        <Link to="/topics">
          Estudiar por tema
        </Link>
      </section>
    </main>
  );
}