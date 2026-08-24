import type {
  EvolutionPoint,
} from "../../types/stats";

import "./EvolutionChart.css";

interface EvolutionChartProps {
  points:
    readonly EvolutionPoint[];
}

const WIDTH = 340;
const HEIGHT = 150;
const PADDING_X = 18;
const PADDING_Y = 18;

export function EvolutionChart({
  points,
}: EvolutionChartProps) {
  if (
    points.length === 0
  ) {
    return (
      <div className="evolution-empty">
        Realiza simulacros para comenzar a construir tu evolución.
      </div>
    );
  }

  const chartWidth =
    WIDTH -
    PADDING_X * 2;

  const chartHeight =
    HEIGHT -
    PADDING_Y * 2;

  const coordinates =
    points.map(
      (
        point,
        index,
      ) => {
        const x =
          points.length ===
          1
            ? WIDTH / 2
            : PADDING_X +
              (
                index /
                (
                  points.length -
                  1
                )
              ) *
                chartWidth;

        const y =
          PADDING_Y +
          (
            (
              100 -
              point.percentage
            ) /
            100
          ) *
            chartHeight;

        return {
          ...point,
          x,
          y,
        };
      },
    );

  const path =
    coordinates
      .map(
        (
          point,
          index,
        ) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x} ${point.y}`,
      )
      .join(" ");

  return (
    <div className="evolution-chart">
      <div className="evolution-chart__labels">
        <span>
          100%
        </span>

        <span>
          50%
        </span>

        <span>
          0%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Evolución del porcentaje obtenido en los últimos simulacros"
      >
        <line
          x1={PADDING_X}
          y1={PADDING_Y}
          x2={
            WIDTH -
            PADDING_X
          }
          y2={PADDING_Y}
          className="evolution-chart__grid"
        />

        <line
          x1={PADDING_X}
          y1={HEIGHT / 2}
          x2={
            WIDTH -
            PADDING_X
          }
          y2={HEIGHT / 2}
          className="evolution-chart__grid"
        />

        <line
          x1={PADDING_X}
          y1={
            HEIGHT -
            PADDING_Y
          }
          x2={
            WIDTH -
            PADDING_X
          }
          y2={
            HEIGHT -
            PADDING_Y
          }
          className="evolution-chart__grid"
        />

        <path
          d={path}
          className="evolution-chart__line"
        />

        {coordinates.map(
          (point) => (
            <g
              key={
                point.id
              }
            >
              <circle
                cx={
                  point.x
                }
                cy={
                  point.y
                }
                r="5"
                className="evolution-chart__point"
              />

              <text
                x={
                  point.x
                }
                y={
                  Math.max(
                    11,
                    point.y -
                      10,
                  )
                }
                textAnchor="middle"
                className="evolution-chart__value"
              >
                {
                  point.percentage
                }
                %
              </text>
            </g>
          ),
        )}
      </svg>

      <div className="evolution-chart__attempts">
        {points.map(
          (
            point,
            index,
          ) => (
            <span
              key={
                point.id
              }
            >
              {index + 1}
            </span>
          ),
        )}
      </div>
    </div>
  );
}