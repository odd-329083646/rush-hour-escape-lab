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
        <filter id={`toyShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="2.6" floodOpacity="0.44" />
        </filter>
        <linearGradient id={`bodyGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={`cabinGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`glassGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.58" />
          <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`lightGrad-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.92" />
        </radialGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#toyShadow-${uid})`}
      >
        {/* דופן תחתונה עדינה לחידוד עובי הרכב */}
        <path
          d={`M 24 15 H ${length - 24} Q ${length - 6} 15 ${length - 6} 35 V 71 Q ${length - 6} 91 ${length - 24} 91 H 24 Q 6 91 6 71 V 35 Q 6 15 24 15 Z`}
          fill="#000000"
          opacity="0.22"
          pointerEvents="none"
        />

        {/* מראות צד */}
        <g
          fill="currentColor"
          stroke="var(--vehicle-detail-edge)"
          strokeOpacity="0.45"
          strokeWidth="1.6"
        >
          <ellipse cx={length - 46} cy="9" rx="6" ry="3.6" />
          <ellipse cx={length - 46} cy="91" rx="6" ry="3.6" />
        </g>

        {/* גוף ראשי עגלגל ומפוסל */}
        <path
          className="vehicle-body"
          d={`M 24 12 H ${length - 24} Q ${length - 6} 12 ${length - 6} 32 V 68 Q ${length - 6} 88 ${length - 24} 88 H 24 Q 6 88 6 68 V 32 Q 6 12 24 12 Z`}
        />
        <path
          d={`M 24 12 H ${length - 24} Q ${length - 6} 12 ${length - 6} 32 V 68 Q ${length - 6} 88 ${length - 24} 88 H 24 Q 6 88 6 68 V 32 Q 6 12 24 12 Z`}
          fill={`url(#bodyGrad-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* מכולה / ארגז משאית עם מסגרת כפולה ברורה */}
            <rect
              x="12"
              y="16"
              width={cabX - 10}
              height="68"
              rx="14"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.42"
              strokeWidth="2"
            />
            <rect
              x="12"
              y="16"
              width={cabX - 10}
              height="68"
              rx="14"
              fill={`url(#cabinGrad-${uid})`}
              pointerEvents="none"
            />
            {/* מסגרת פנימית עבה של דופן המכולה */}
            <rect
              x="19"
              y="23"
              width={cabX - 24}
              height="54"
              rx="9"
              fill="#000000"
              fillOpacity="0.16"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.34"
              strokeWidth="2.2"
              pointerEvents="none"
            />

            {/* קו חיבור ברור בין הארגז לקבינה */}
            <line
              x1={cabX + 2}
              y1="14"
              x2={cabX + 2}
              y2="86"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.48"
              strokeWidth="2.4"
            />

            {/* שמשה קדמית גדולה וברורה בקבינה */}
            <rect
              x={cabX + 10}
              y="24"
              width="24"
              height="52"
              rx="9"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.46"
              strokeWidth="1.8"
            />
            <rect
              x={cabX + 10}
              y="24"
              width="24"
              height="52"
              rx="9"
              fill={`url(#glassGrad-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* קבינה / גג מעוגל של מכונית */}
            <path
              d={`M 36 19 H ${length - 28} Q ${length - 16} 19 ${length - 16} 34 V 66 Q ${length - 16} 81 ${length - 28} 81 H 36 Q 22 81 22 66 V 34 Q 22 19 36 19 Z`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.34"
              strokeWidth="1.8"
            />
            <path
              d={`M 36 19 H ${length - 28} Q ${length - 16} 19 ${length - 16} 34 V 66 Q ${length - 16} 81 ${length - 28} 81 H 36 Q 22 81 22 66 V 34 Q 22 19 36 19 Z`}
              fill={`url(#cabinGrad-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה קדמית רחבה וברורה */}
            <rect
              x={length - 46}
              y="24"
              width="22"
              height="52"
              rx="9"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.46"
              strokeWidth="1.8"
            />
            <rect
              x={length - 46}
              y="24"
              width="22"
              height="52"
              rx="9"
              fill={`url(#glassGrad-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים */}
        <g stroke="var(--vehicle-detail-edge)" strokeOpacity="0.38" strokeWidth="1.4">
          <ellipse cx={length - 14} cy="28" rx="5.8" ry="7.4" fill={`url(#lightGrad-${uid})`} />
          <ellipse cx={length - 14} cy="72" rx="5.8" ry="7.4" fill={`url(#lightGrad-${uid})`} />
        </g>

        {/* גריל קדמי קטן */}
        <rect
          x={length - 11}
          y="43"
          width="3.5"
          height="14"
          rx="1.75"
          fill="#0f172a"
          opacity="0.45"
        />
      </g>
    </svg>
  );
}
