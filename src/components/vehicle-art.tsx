import { useId } from "react";
import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const uid = useId().replace(/:/g, "");
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const cabX = length - 76;

  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <defs>
        <filter id={`toyShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="2.5" floodOpacity="0.4" />
        </filter>
        <radialGradient id={`toyDome-${uid}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id={`glassTone-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={`headlightTone-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0.88" />
        </radialGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#toyShadow-${uid})`}
      >
        {/* מראות צד חמודות ליד הקבינה */}
        <g
          fill="currentColor"
          stroke="var(--vehicle-detail-edge)"
          strokeOpacity="0.45"
          strokeWidth="1.8"
        >
          <ellipse cx={length - 48} cy="8" rx="7" ry="4.5" />
          <ellipse cx={length - 48} cy="92" rx="7" ry="4.5" />
        </g>

        {/* גוף צעצוע עגלגל אחיד שמחבר את כל הרכב */}
        <path
          className="vehicle-body"
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
        />
        <path
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
          fill={`url(#toyDome-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* משטח ארגז מחובר ועדין */}
            <rect
              x="16"
              y="19"
              width={cabX - 18}
              height="62"
              rx="15"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.28"
              strokeWidth="1.8"
            />
            <rect
              x="16"
              y="19"
              width={cabX - 18}
              height="62"
              rx="15"
              fill={`url(#toyDome-${uid})`}
              pointerEvents="none"
            />
            {/* צלעות עדינות על הארגז */}
            <g
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.2"
              strokeWidth="2.5"
              pointerEvents="none"
            >
              <line x1="42" y1="24" x2="42" y2="76" />
              <line x1="72" y1="24" x2="72" y2="76" />
              <line x1="102" y1="24" x2="102" y2="76" />
            </g>

            {/* קו הפרדה עדין שמחבר בין הארגז לקבינה בלי לנתק */}
            <line
              x1={cabX + 2}
              y1="15"
              x2={cabX + 2}
              y2="85"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.38"
              strokeWidth="2"
            />

            {/* שמשה קדמית עגלגלה בקבינה */}
            <rect
              x={cabX + 10}
              y="25"
              width="21"
              height="50"
              rx="9"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.42"
              strokeWidth="2"
            />
            <rect
              x={cabX + 10}
              y="25"
              width="21"
              height="50"
              rx="9"
              fill={`url(#glassTone-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* גג מעוגל של מכונית */}
            <rect
              x="27"
              y="18"
              width={length - 54}
              height="64"
              rx="22"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
            <rect
              x="27"
              y="18"
              width={length - 54}
              height="64"
              rx="22"
              fill={`url(#toyDome-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה אחורית עדינה */}
            <rect
              x="31"
              y="29"
              width="12"
              height="42"
              rx="6"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.35"
              strokeWidth="1.6"
            />
            <rect
              x="31"
              y="29"
              width="12"
              height="42"
              rx="6"
              fill={`url(#glassTone-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה קדמית עגלגלה וברורה */}
            <rect
              x={length - 48}
              y="26"
              width="18"
              height="48"
              rx="8.5"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.42"
              strokeWidth="2"
            />
            <rect
              x={length - 48}
              y="26"
              width="18"
              height="48"
              rx="8.5"
              fill={`url(#glassTone-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים חמודים */}
        <g stroke="var(--vehicle-detail-edge)" strokeOpacity="0.35" strokeWidth="1.4">
          <ellipse cx={length - 16} cy="28" rx="6" ry="7.5" fill={`url(#headlightTone-${uid})`} />
          <ellipse cx={length - 16} cy="72" rx="6" ry="7.5" fill={`url(#headlightTone-${uid})`} />
        </g>

        {/* גריל קדמי קטן */}
        <rect
          x={length - 13}
          y="42"
          width="4"
          height="16"
          rx="2"
          fill="#0f172a"
          opacity="0.45"
        />
      </g>
    </svg>
  );
}
