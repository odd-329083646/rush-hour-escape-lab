import { useId } from "react";
import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const uid = useId().replace(/:/g, "");
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const cabX = length - 66;

  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <defs>
        <linearGradient id={`clayBody-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`clayRoof-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={`clayGlass-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#334155" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        {/* צל רך מתחת לרכב */}
        <rect
          x="11"
          y="18"
          width={length - 22}
          height="74"
          rx="26"
          fill="#000000"
          opacity="0.32"
        />

        {/* גלגלים עגולים קטנים שמציצים מהצד */}
        <g className="vehicle-tires">
          <rect x="26" y="5" width="24" height="12" rx="6" />
          <rect x="26" y="83" width="24" height="12" rx="6" />
          <rect x={length - 52} y="5" width="24" height="12" rx="6" />
          <rect x={length - 52} y="83" width="24" height="12" rx="6" />
        </g>

        {/* גוף צעצוע מט/רך */}
        <rect
          className="vehicle-body"
          x="10"
          y="13"
          width={length - 20}
          height="74"
          rx="26"
        />
        <rect
          x="10"
          y="13"
          width={length - 20}
          height="74"
          rx="26"
          fill={`url(#clayBody-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית עגלגל ורך */}
            <rect
              x="18"
              y="22"
              width={cabX - 24}
              height="56"
              rx="15"
              fill={`url(#clayRoof-${uid})`}
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.25"
              strokeWidth="2"
            />
            <line
              className="vehicle-seam"
              x1={cabX - 2}
              y1="17"
              x2={cabX - 2}
              y2="83"
            />
            {/* שמשה קדמית רכה לקבינה */}
            <rect
              x={cabX + 7}
              y="27"
              width="20"
              height="46"
              rx="9"
              fill={`url(#clayGlass-${uid})`}
            />
          </>
        ) : (
          <>
            {/* תא נוסעים מעוגל */}
            <rect
              x="28"
              y="20"
              width={length - 56}
              height="60"
              rx="18"
              fill={`url(#clayRoof-${uid})`}
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.22"
              strokeWidth="2"
            />
            {/* שמשה אחורית ושמשה קדמית רכות */}
            <rect
              x="34"
              y="28"
              width="12"
              height="44"
              rx="6"
              fill={`url(#clayGlass-${uid})`}
            />
            <rect
              x={length - 46}
              y="28"
              width="13"
              height="44"
              rx="6.5"
              fill={`url(#clayGlass-${uid})`}
            />
          </>
        )}

        {/* פנסים קדמיים צהובים חמודים כמו ברקע */}
        <g fill="#facc15" opacity="0.92">
          <rect x={length - 16} y="25" width="5" height="12" rx="2.5" />
          <rect x={length - 16} y="63" width="5" height="12" rx="2.5" />
        </g>

        {/* פנסים אחוריים עדינים */}
        <g className="vehicle-taillights">
          <rect x="12" y="27" width="4" height="10" rx="2" />
          <rect x="12" y="63" width="4" height="10" rx="2" />
        </g>
      </g>
    </svg>
  );
}
