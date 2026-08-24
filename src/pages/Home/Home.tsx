import {
  useMemo,
} from "react";

import {
  DroneBackground,
} from "../../components/DroneBackground/DroneBackground";

import {
  MenuButton,
} from "../../components/MenuButton/MenuButton";

import {
  getQuestionBank,
  getTopics,
} from "../../services/quizEngine";

import {
  loadProgress,
} from "../../services/storageService";

import "./Home.css";

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function TopicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h10" />
    </svg>
  );
}

function MistakeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3 2 21h20L12 3z" />
      <path d="M12 9v5" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  );
}

function ExamIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="13"
        r="8"
      />

      <path d="M12 9v4l3 2" />

      <path d="M9 2h6" />

      <path d="M12 2v3" />
    </svg>
  );
}

export function Home() {
  const totalQuestions =
    useMemo(
      () =>
        getQuestionBank().length,
      [],
    );

  const totalTopics =
    useMemo(
      () =>
        getTopics().length,
      [],
    );

  const progress =
    useMemo(
      () =>
        loadProgress(),
      [],
    );

  const totalAttempts =
    Object.values(
      progress.questionStats,
    ).reduce(
      (sum, stats) =>
        sum + stats.attempts,
      0,
    );

  const totalCorrect =
    Object.values(
      progress.questionStats,
    ).reduce(
      (sum, stats) =>
        sum + stats.correct,
      0,
    );

  const accuracy =
    totalAttempts > 0
      ? Math.round(
          (
            totalCorrect /
            totalAttempts
          ) * 100,
        )
      : 0;

  return (
    <main className="home">
      <DroneBackground />

      <section className="home__content">
        <header className="home__header">
          <div className="home__status">
            <span className="status-dot" />

            SISTEMA LISTO
          </div>

          <div className="home__brand">
            <span className="home__eyebrow">
              PILOTO UAS
            </span>

            <h1>
              UAS
              <span>
                TRAINER
              </span>
            </h1>

            <p>
              Domina el banco.
              Prepárate para volar.
            </p>
          </div>
        </header>

        <section
          className="home__progress"
          aria-label="Resumen de progreso"
        >
          <div>
            <strong>
              {totalQuestions}
            </strong>

            <span>
              preguntas
            </span>
          </div>

          <div>
            <strong>
              {totalTopics}
            </strong>

            <span>
              temas
            </span>
          </div>

          <div>
            <strong>
              {accuracy}%
            </strong>

            <span>
              precisión
            </span>
          </div>
        </section>

        <nav
          className="home__menu"
          aria-label="Menú principal"
        >
          <MenuButton
            to="/quiz"
            title="Simulacro"
            subtitle="50 preguntas aleatorias"
            icon={<PlayIcon />}
            variant="primary"
          />

          <MenuButton
            to="/topics"
            title="Estudiar por tema"
            subtitle="Entrena un módulo completo"
            icon={<TopicIcon />}
          />

          <MenuButton
            to="/mistakes"
            title="Mis errores"
            subtitle="Refuerza tus puntos débiles"
            icon={<MistakeIcon />}
          />

          <div className="home__secondary-menu">
            <MenuButton
              to="/stats"
              title="Estadísticas"
              icon={<StatsIcon />}
              variant="compact"
            />

            <MenuButton
              to="/quiz?mode=exam"
              title="Modo examen"
              subtitle="50 preguntas · 45 min"
              icon={<ExamIcon />}
              variant="compact"
            />
          </div>
        </nav>

        <footer className="home__footer">
          <span>
            UAS TRAINER
          </span>

          <span>
            V1.3
          </span>
        </footer>
      </section>
    </main>
  );
}