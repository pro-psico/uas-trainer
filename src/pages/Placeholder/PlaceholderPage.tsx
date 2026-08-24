import {
  Link,
} from "react-router-dom";

import "./PlaceholderPage.css";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="placeholder">
      <section className="placeholder__card">
        <span className="placeholder__eyebrow">
          UAS TRAINER
        </span>

        <h1>
          {title}
        </h1>

        <p>
          {description}
        </p>

        <Link
          to="/"
          className="placeholder__back"
        >
          ← Volver al menú
        </Link>
      </section>
    </main>
  );
}