import "./DroneBackground.css";

interface DroneProps {
  className: string;
}

function Drone({ className }: DroneProps) {
  return (
    <div
      className={`drone ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 120"
        role="presentation"
        focusable="false"
      >
        <g className="drone__rotors">
          <ellipse
            cx="40"
            cy="30"
            rx="34"
            ry="5"
          />

          <ellipse
            cx="180"
            cy="30"
            rx="34"
            ry="5"
          />
        </g>

        <g className="drone__structure">
          <line
            x1="85"
            y1="58"
            x2="40"
            y2="30"
          />

          <line
            x1="135"
            y1="58"
            x2="180"
            y2="30"
          />

          <circle
            cx="40"
            cy="30"
            r="8"
          />

          <circle
            cx="180"
            cy="30"
            r="8"
          />

          <path
            d="
              M78 52
              Q110 35 142 52
              L133 77
              Q110 88 87 77
              Z
            "
          />

          <rect
            x="102"
            y="74"
            width="16"
            height="16"
            rx="4"
          />

          <circle
            cx="110"
            cy="92"
            r="6"
            className="drone__camera"
          />

          <line
            x1="90"
            y1="76"
            x2="78"
            y2="100"
          />

          <line
            x1="130"
            y1="76"
            x2="142"
            y2="100"
          />

          <line
            x1="72"
            y1="100"
            x2="88"
            y2="100"
          />

          <line
            x1="132"
            y1="100"
            x2="148"
            y2="100"
          />
        </g>
      </svg>
    </div>
  );
}

export function DroneBackground() {
  return (
    <div
      className="drone-background"
      aria-hidden="true"
    >
      <div className="hud hud--left">
        <span />
        <span />
        <span />
      </div>

      <div className="hud-circle hud-circle--top" />

      <div className="hud-circle hud-circle--bottom" />

      <div className="scan-line" />

      <div className="grid-overlay" />

      <Drone className="drone--one" />

      <Drone className="drone--two" />

      <Drone className="drone--three" />
    </div>
  );
}