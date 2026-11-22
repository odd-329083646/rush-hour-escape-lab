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
        <linearGradient id={`toyVolume-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`roofGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={`glassSheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        {/* צל רך מתחת לרכב */}
        <rect
          x="10"
          y="18"
          width={length - 20}
          height="74"
          rx="24"
          fill="#000000"
          opacity="0.34"
        />

        {/* גלגלי צעצוע עגלגלים */}
        <g className="vehicle-tires">
          <rect x="25" y="3" width="28" height="15" rx="7.5" />
          <rect x="25" y="82" width="28" height="15" rx="7.5" />
          <rect x={length - 55} y="3" width="28" height="15" rx="7.5" />
          <rect x={length - 55} y="82" width="28" height="15" rx="7.5" />
        </g>

        {/* פסי הצללה עדינים על הגלגלים */}
        <g opacity="0.28" fill="#ffffff" pointerEvents="none">
          <rect x="33" y="6" width="14" height="4" rx="2" />
          <rect x="33" y="90" width="14" height="4" rx="2" />
          <rect x={length - 47} y="6" width="14" height="4" rx="2" />
          <rect x={length - 47} y="90" width="14" height="4" rx="2" />
        </g>

        {/* גוף עיקרי מעוגל וחמוד */}
        <path
          className="vehicle-body"
          d={`M 25 12 H ${length - 25} Q ${length - 8} 12 ${length - 8} 29 V 71 Q ${length - 8} 88 ${length - 25} 88 H 25 Q 8 88 8 71 V 29 Q 8 12 25 12 Z`}
        />

        {/* נפח והצללה תלת-ממדית */}
        <path
          d={`M 25 12 H ${length - 25} Q ${length - 8} 12 ${length - 8} 29 V 71 Q ${length - 8} 88 ${length - 25} 88 H 25 Q 8 88 8 71 V 29 Q 8 12 25 12 Z`}
          fill={`url(#toyVolume-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית צעצוע עגלגל */}
            <rect
              className="vehicle-cargo"
              x="16"
              y="20"
              width={cabX - 24}
              height="60"
              rx="14"
            />
            {/* פסי נוי עדינים בארגז */}
            <line
              className="vehicle-seam"
              x1="44"
              y1="26"
              x2="44"
              y2="74"
              opacity="0.45"
            />
            <line
              className="vehicle-seam"
              x1="72"
              y1="26"
              x2="72"
              y2="74"
              opacity="0.45"
            />
            {/* הפרדה לקבינה */}
            <line
              className="vehicle-seam"
              x1={cabX - 4}
              y1="15"
              x2={cabX - 4}
              y2="85"
            />
            {/* שמשה קדמית עגלגלה */}
            <rect
              className="vehicle-window"
              x={cabX + 6}
              y="26"
              width="24"
              height="48"
              rx="12"
            />
            <ellipse
              cx={cabX + 14}
              cy="39"
              rx="4"
              ry="8"
              fill={`url(#glassSheen-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* תא נוסעים מעוגל וידידותי */}
            <rect
              className="vehicle-body"
              x="27"
              y="19"
              width={length - 54}
              height="62"
              rx="20"
            />
            {/* שמשה אחורית מעוגלת */}
            <rect
              className="vehicle-window"
              x="32"
              y="27"
              width="14"
              height="46"
              rx="7"
            />
            {/* גג רך עם ברק */}
            <rect
              x="50"
              y="25"
              width={length - 104}
              height="50"
              rx="14"
              fill={`url(#roofGrad-${uid})`}
              pointerEvents="none"
            />
            {/* שמשה קדמית מעוגלת */}
            <rect
              className="vehicle-window"
              x={length - 46}
              y="27"
              width="15"
              height="46"
              rx="7.5"
            />
            <ellipse
              cx={length - 40}
              cy="39"
              rx="3.5"
              ry="7.5"
              fill={`url(#glassSheen-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים */}
        <g className="vehicle-headlights">
          <rect x={length - 15} y="24" width="5" height="13" rx="2.5" />
          <rect x={length - 15} y="63" width="5" height="13" rx="2.5" />
        </g>

        {/* פנסים אחוריים */}
        <g className="vehicle-taillights">
          <rect x="11" y="25" width="4.5" height="11" rx="2.25" />
          <rect x="11" y="64" width="4.5" height="11" rx="2.25" />
        </g>
      </g>
    </svg>
  );
}
