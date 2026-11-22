import { useId } from "react";
import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const uid = useId().replace(/:/g, "");
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const front = length - 56;

  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <defs>
        <linearGradient id={`bodyGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`glassGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        {/* צל תלת-ממדי רך מתחת לרכב */}
        <rect
          x="10"
          y="18"
          width={length - 20}
          height="74"
          rx="26"
          fill="#000000"
          opacity="0.32"
        />

        {/* גוף עיקרי עם נפח והצללה */}
        <rect
          className="vehicle-body"
          x="10"
          y="12"
          width={length - 20}
          height="72"
          rx="25"
        />
        <rect
          x="10"
          y="12"
          width={length - 20}
          height="72"
          rx="25"
          fill={`url(#bodyGrad-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית תלת-ממדי נקי */}
            <rect
              className="vehicle-cargo"
              x="20"
              y="22"
              width={length - 88}
              height="52"
              rx="14"
            />
            <rect
              x="20"
              y="22"
              width={length - 88}
              height="52"
              rx="14"
              fill={`url(#bodyGrad-${uid})`}
              pointerEvents="none"
            />
            <line
              className="vehicle-seam"
              x1={front - 14}
              y1="16"
              x2={front - 14}
              y2="80"
            />
          </>
        ) : (
          /* גג/תא נוסעים מעוגל עם עומק */
          <rect
            className="vehicle-window"
            x="26"
            y="25"
            width="34"
            height="46"
            rx="14"
          />
        )}

        {/* שמשה קדמית נקייה עם ברק תלת-ממדי */}
        <rect
          className="vehicle-window"
          x={front}
          y="25"
          width="24"
          height="46"
          rx="11"
        />
        <rect
          x={front}
          y="25"
          width="24"
          height="46"
          rx="11"
          fill={`url(#glassGrad-${uid})`}
          pointerEvents="none"
        />

        {/* פנסים קדמיים עדינים */}
        <g className="vehicle-headlights">
          <rect x={length - 16} y="28" width="5" height="12" rx="2.5" />
          <rect x={length - 16} y="56" width="5" height="12" rx="2.5" />
        </g>
      </g>
    </svg>
  );
}
