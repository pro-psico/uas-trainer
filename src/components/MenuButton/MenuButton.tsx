import type {
  ReactNode,
} from "react";

import {
  Link,
} from "react-router-dom";

import "./MenuButton.css";

interface MenuButtonProps {
  to: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "compact";
}

export function MenuButton({
  to,
  title,
  subtitle,
  icon,
  variant = "secondary",
}: MenuButtonProps) {
  return (
    <Link
      to={to}
      className={
        `menu-button menu-button--${variant}`
      }
    >
      <span
        className="menu-button__icon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="menu-button__content">
        <strong>
          {title}
        </strong>

        {subtitle && (
          <small>
            {subtitle}
          </small>
        )}
      </span>

      <span
        className="menu-button__arrow"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}