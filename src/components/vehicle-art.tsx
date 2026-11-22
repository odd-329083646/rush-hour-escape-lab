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
        <filter id={`cleanShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="2.2" floodOpacity="0.4" />
        </filter>
        <radialGradient id={`toyDome-${uid}`} cx="50%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="56%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id={`glassTone-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.36" />
        </linearGradient>
        <radialGradient id={`headlightTone-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0.88" />
        </radialGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#cleanShadow-${uid})`}
      >
        {/* מראות צד עדינות */}
        <g
          fill="currentColor"
          stroke="var(--vehicle-detail-edge)"
          strokeOpacity="0.42"
          strokeWidth="1.5"
        >
          <ellipse cx={length - 48} cy="9.5" rx="5.8" ry="3.4" />
          <ellipse cx={length - 48} cy="90.5" rx="5.8" ry="3.4" />
        </g>

        {/* גוף צעצוע ראשי */}
        <path
          className="vehicle-body"
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
        />
        <path
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
          fill={`url(#toyDome-${uid})`}
          pointerEvents="none"
        />

        {/* קו אור עדין לאורך הצד העליון */}
        <line
          x1="28"
          y1="14.5"
          x2={length - 28}
          y2="14.5"
          stroke="#ffffff"
          strokeOpacity="0.28"
          strokeWidth="2"
          strokeLinecap="round"
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית נקי ומחובר */}
            <rect
              x="14"
              y="17"
              width={cabX - 14}
              height="66"
              rx="15"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.34"
              strokeWidth="1.7"
            />
            <rect
              x="14"
              y="17"
              width={cabX - 14}
              height="66"
              rx="15"
              fill={`url(#toyDome-${uid})`}
              pointerEvents="none"
            />
            {/* מסגרת פנימית ופסי ארגז */}
            <rect
              x="20"
              y="22"
              width={cabX - 26}
              height="56"
              rx="11"
              fill="#000000"
              fillOpacity="0.1"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.24"
              strokeWidth="1.4"
              pointerEvents="none"
            />
            <g
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.26"
              strokeWidth="2.6"
              pointerEvents="none"
            >
              <line x1="42" y1="24" x2="42" y2="76" />
              <line x1="70" y1="24" x2="70" y2="76" />
              <line x1="98" y1="24" x2="98" y2="76" />
            </g>

            {/* קו הפרדה עדין לקבינה */}
            <line
              x1={cabX + 2}
              y1="14"
              x2={cabX + 2}
              y2="86"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.4"
              strokeWidth="2"
            />

            {/* שמשה קדמית של הקבינה */}
            <rect
              x={cabX + 10}
              y="24"
              width="22"
              height="52"
              rx="8.5"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.4"
              strokeWidth="1.7"
            />
            <rect
              x={cabX + 10}
              y="24"
              width="22"
              height="52"
              rx="8.5"
              fill={`url(#glassTone-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* קבינה / גג מעוגל של מכונית */}
            <rect
              x="26"
              y="18"
              width={length - 52}
              height="64"
              rx="22"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.25"
              strokeWidth="1.6"
            />
            <rect
              x="26"
              y="18"
              width={length - 52}
              height="64"
              rx="22"
              fill={`url(#toyDome-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה קדמית רחבה וברורה */}
            <rect
              x={length - 49}
              y="25"
              width="20"
              height="50"
              rx="8.5"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.4"
              strokeWidth="1.7"
            />
            <rect
              x={length - 49}
              y="25"
              width="20"
              height="50"
              rx="8.5"
              fill={`url(#glassTone-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים */}
        <g stroke="var(--vehicle-detail-edge)" strokeOpacity="0.35" strokeWidth="1.3">
          <ellipse cx={length - 15} cy="28" rx="5.5" ry="7" fill={`url(#headlightTone-${uid})`} />
          <ellipse cx={length - 15} cy="72" rx="5.5" ry="7" fill={`url(#headlightTone-${uid})`} />
        </g>

        {/* גריל קדמי קטן */}
        <rect
          x={length - 12}
          y="43"
          width="3.5"
          height="14"
          rx="1.75"
          fill="#0f172a"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}
