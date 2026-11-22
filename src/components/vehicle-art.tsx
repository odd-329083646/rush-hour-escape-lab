import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const front = length - 58;

  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        {/* גלגלי צעצוע עגלגלים ורכים */}
        <g className="vehicle-tires">
          <rect x="26" y="4" width="28" height="16" rx="8" />
          <rect x="26" y="80" width="28" height="16" rx="8" />
          <rect x={length - 56} y="4" width="28" height="16" rx="8" />
          <rect x={length - 56} y="80" width="28" height="16" rx="8" />
        </g>

        {/* גוף צעצוע עגלגל ושמנמן */}
        <path
          className="vehicle-body"
          d={`M 28 12 H ${length - 30} Q ${length - 8} 12 ${length - 8} 36 V 64 Q ${length - 8} 88 ${length - 30} 88 H 28 Q 8 88 8 66 V 34 Q 8 12 28 12 Z`}
        />

        {/* ברק עליון רך של פלסטיק צעצוע */}
        <path
          className="vehicle-body-shine"
          d={`M 30 16 H ${length - 34} Q ${length - 16} 16 ${length - 15} 29 H 16 Q 16 16 30 16 Z`}
        />

        {isTruck ? (
          <>
            {/* ארגז משאית עגלגל וידידותי */}
            <rect
              className="vehicle-cargo"
              x="18"
              y="22"
              width={length - 96}
              height="56"
              rx="14"
            />
            <circle
              className="vehicle-cargo-ribs"
              cx="48"
              cy="50"
              r="7"
            />
            <circle
              className="vehicle-cargo-ribs"
              cx="84"
              cy="50"
              r="7"
            />
            <circle
              className="vehicle-cargo-ribs"
              cx="120"
              cy="50"
              r="7"
            />
            <path className="vehicle-seam" d={`M ${front - 16} 18 V 82`} />
          </>
        ) : (
          /* גג/חלון עגלגל למכונית צעצוע */
          <rect
            className="vehicle-window"
            x="28"
            y="24"
            width="34"
            height="52"
            rx="16"
          />
        )}

        {/* שמשה קדמית מעוגלת עם ברק חמוד */}
        <rect
          className="vehicle-window"
          x={front}
          y="24"
          width="22"
          height="52"
          rx="11"
        />
        <ellipse
          className="vehicle-window-shine"
          cx={front + 7}
          cy="37"
          rx="4"
          ry="9"
        />

        {/* פנסים קדמיים עגולים וחמודים */}
        <g className="vehicle-headlights">
          <circle cx={length - 15} cy="30" r="6" />
          <circle cx={length - 15} cy="70" r="6" />
        </g>

        {/* פנסים אחוריים רכים */}
        <g className="vehicle-taillights">
          <rect x="11" y="27" width="6" height="12" rx="3" />
          <rect x="11" y="61" width="6" height="12" rx="3" />
        </g>
      </g>
    </svg>
  );
}
