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
        <filter id={`toyGlowShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="2.5" floodOpacity="0.38" />
        </filter>
        <radialGradient id={`toyDome-${uid}`} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.36" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </radialGradient>
        <linearGradient id={`softGlass-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`lampGlow-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#toyGlowShadow-${uid})`}
      >
        {/* מראות צד קטנות וחמודות */}
        <g fill="currentColor" stroke="var(--vehicle-detail-edge)" strokeOpacity="0.45" strokeWidth="2">
          <ellipse cx={length - 44} cy="7" rx="8" ry="5" />
          <ellipse cx={length - 44} cy="93" rx="8" ry="5" />
        </g>

        {/* גוף צעצוע עגלגל ושמנמן */}
        <path
          className="vehicle-body"
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
        />

        {/* הצללת נפח עגלגלה */}
        <path
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
          fill={`url(#toyDome-${uid})`}
          pointerEvents="none"
        />

        {/* פס פגוש/טמבון קדמי עדין */}
        <rect
          x={length - 12}
          y="24"
          width="5"
          height="52"
          rx="2.5"
          fill="#ffffff"
          opacity="0.25"
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית עגלגל ורך */}
            <rect
              x="16"
              y="19"
              width={cabX - 22}
              height="62"
              rx="18"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.32"
              strokeWidth="2"
            />
            <rect
              x="16"
              y="19"
              width={cabX - 22}
              height="62"
              rx="18"
              fill={`url(#toyDome-${uid})`}
              pointerEvents="none"
            />
            {/* שמשה קדמית מעוגלת לקבינה */}
            <rect
              x={cabX + 6}
              y="26"
              width="22"
              height="48"
              rx="10"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.4"
              strokeWidth="2"
            />
            <rect
              x={cabX + 6}
              y="26"
              width="22"
              height="48"
              rx="10"
              fill={`url(#softGlass-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* גג מכונית מעוגל */}
            <rect
              x="28"
              y="18"
              width={length - 56}
              height="64"
              rx="22"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
            <rect
              x="28"
              y="18"
              width={length - 56}
              height="64"
              rx="22"
              fill={`url(#toyDome-${uid})`}
              pointerEvents="none"
            />
            {/* שמשה קדמית מעוגלת ורכה */}
            <rect
              x={length - 48}
              y="27"
              width="17"
              height="46"
              rx="8"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.38"
              strokeWidth="2"
            />
            <rect
              x={length - 48}
              y="27"
              width="17"
              height="46"
              rx="8"
              fill={`url(#softGlass-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים עגולים ורכים */}
        <g stroke="var(--vehicle-detail-edge)" strokeOpacity="0.35" strokeWidth="1.5">
          <ellipse cx={length - 16} cy="28" rx="6.5" ry="8" fill={`url(#lampGlow-${uid})`} />
          <ellipse cx={length - 16} cy="72" rx="6.5" ry="8" fill={`url(#lampGlow-${uid})`} />
        </g>

        {/* גריל/חיוך קדמי קטן ועדין */}
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
