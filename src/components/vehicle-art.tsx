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
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={`glassSheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        {/* צל רך על החניון */}
        <rect
          x="10"
          y="17"
          width={length - 20}
          height="74"
          rx="22"
          fill="#000000"
          opacity="0.35"
        />

        {/* גלגלי צעצוע עגלגלים שמציצים מהצדדים */}
        <g className="vehicle-tires">
          <rect x="26" y="4" width="26" height="14" rx="6" />
          <rect x="26" y="82" width="26" height="14" rx="6" />
          <rect x={length - 54} y="4" width="26" height="14" rx="6" />
          <rect x={length - 54} y="82" width="26" height="14" rx="6" />
        </g>

        {/* גוף הרכב העיקרי עם פגושים מעוגלים */}
        <path
          className="vehicle-body"
          d={`M 24 13 H ${length - 24} Q ${length - 9} 13 ${length - 9} 28 V 72 Q ${length - 9} 87 ${length - 24} 87 H 24 Q 9 87 9 72 V 28 Q 9 13 24 13 Z`}
        />

        {/* נפח והצללה תלת-ממדית */}
        <path
          d={`M 24 13 H ${length - 24} Q ${length - 9} 13 ${length - 9} 28 V 72 Q ${length - 9} 87 ${length - 24} 87 H 24 Q 9 87 9 72 V 28 Q 9 13 24 13 Z`}
          fill={`url(#toyVolume-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית מוגדר עם שוליים */}
            <rect
              className="vehicle-cargo"
              x="16"
              y="20"
              width={cabX - 24}
              height="60"
              rx="10"
            />
            {/* קו הפרדה ברור בין הארגז לקבינה */}
            <line
              className="vehicle-seam"
              x1={cabX - 4}
              y1="15"
              x2={cabX - 4}
              y2="85"
            />
            {/* שמשה קדמית של קבינת המשאית */}
            <path
              className="vehicle-window"
              d={`M ${cabX + 6} 25 H ${cabX + 26} Q ${cabX + 34} 50 ${cabX + 26} 75 H ${cabX + 6} Q ${cabX + 2} 50 ${cabX + 6} 25 Z`}
            />
            <path
              d={`M ${cabX + 9} 29 H ${cabX + 22} L ${cabX + 14} 52 H ${cabX + 8} Z`}
              fill={`url(#glassSheen-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* תא נוסעים / גג מכונית עם כתפיים ברורות */}
            <path
              className="vehicle-body"
              d={`M 38 19 H ${length - 36} Q ${length - 26} 19 ${length - 26} 29 V 71 Q ${length - 26} 81 ${length - 36} 81 H 38 Q 28 81 28 71 V 29 Q 28 19 38 19 Z`}
            />
            {/* שמשה אחורית */}
            <path
              className="vehicle-window"
              d={`M 33 27 H 45 V 73 H 33 Q 30 50 33 27 Z`}
            />
            {/* גג מרכזי */}
            <rect
              className="vehicle-body-shine"
              x="49"
              y="25"
              width={length - 102}
              height="50"
              rx="10"
              opacity="0.55"
            />
            {/* שמשה קדמית */}
            <path
              className="vehicle-window"
              d={`M ${length - 47} 27 H ${length - 33} Q ${length - 30} 50 ${length - 33} 73 H ${length - 47} Z`}
            />
            <path
              d={`M ${length - 44} 31 H ${length - 36} L ${length - 43} 52 H ${length - 45} Z`}
              fill={`url(#glassSheen-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים */}
        <g className="vehicle-headlights">
          <rect x={length - 15} y="23" width="5" height="14" rx="2.5" />
          <rect x={length - 15} y="63" width="5" height="14" rx="2.5" />
        </g>

        {/* פנסים אחוריים */}
        <g className="vehicle-taillights">
          <rect x="11" y="24" width="4" height="12" rx="2" />
          <rect x="11" y="64" width="4" height="12" rx="2" />
        </g>
      </g>
    </svg>
  );
}
