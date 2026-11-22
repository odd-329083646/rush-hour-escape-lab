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
        <filter id={`toy3DShadow-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="3.2" floodOpacity="0.48" />
        </filter>
        <filter id={`roofCast-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.32" />
        </filter>
        <linearGradient id={`chassis3D-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="82%" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`elevatedRoof-${uid}`} cx="48%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.26" />
        </radialGradient>
        <linearGradient id={`glass3D-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#cbd5e1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`lamp3D-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="65%" stopColor="#fef08a" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#toy3DShadow-${uid})`}
      >
        {/* דופן תחתונה כהה שנותנת גובה/עובי לרכב */}
        <path
          d={`M 26 16 H ${length - 26} Q ${length - 7} 16 ${length - 7} 36 V 73 Q ${length - 7} 93 ${length - 26} 93 H 26 Q 7 93 7 73 V 36 Q 7 16 26 16 Z`}
          fill="#000000"
          opacity="0.35"
        />

        {/* מראות צד תלת-ממדיות */}
        <g
          fill="currentColor"
          stroke="var(--vehicle-detail-edge)"
          strokeOpacity="0.48"
          strokeWidth="1.6"
        >
          <ellipse cx={length - 48} cy="9" rx="6.5" ry="4" />
          <ellipse cx={length - 48} cy="91" rx="6.5" ry="4" />
        </g>

        {/* גוף ראשי עם נפח תלת-ממדי */}
        <path
          className="vehicle-body"
          d={`M 26 10 H ${length - 26} Q ${length - 7} 10 ${length - 7} 31 V 67 Q ${length - 7} 88 ${length - 26} 88 H 26 Q 7 88 7 67 V 31 Q 7 10 26 10 Z`}
        />
        <path
          d={`M 26 10 H ${length - 26} Q ${length - 7} 10 ${length - 7} 31 V 67 Q ${length - 7} 88 ${length - 26} 88 H 26 Q 7 88 7 67 V 31 Q 7 10 26 10 Z`}
          fill={`url(#chassis3D-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* מכולה / ארגז משאית מוגבה עם צל */}
            <rect
              x="14"
              y="16"
              width={cabX - 14}
              height="66"
              rx="15"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.38"
              strokeWidth="1.8"
              filter={`url(#roofCast-${uid})`}
            />
            <rect
              x="14"
              y="16"
              width={cabX - 14}
              height="66"
              rx="15"
              fill={`url(#elevatedRoof-${uid})`}
              pointerEvents="none"
            />
            {/* מסגרת ארגז ופסים ברורים */}
            <rect
              x="20"
              y="22"
              width={cabX - 26}
              height="54"
              rx="10"
              fill="#000000"
              fillOpacity="0.12"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.26"
              strokeWidth="1.5"
              pointerEvents="none"
            />
            <g
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.28"
              strokeWidth="3"
              pointerEvents="none"
            >
              <line x1="42" y1="24" x2="42" y2="74" />
              <line x1="70" y1="24" x2="70" y2="74" />
              <line x1="98" y1="24" x2="98" y2="74" />
            </g>

            {/* קו חיבור ברור לקבינה */}
            <line
              x1={cabX + 2}
              y1="13"
              x2={cabX + 2}
              y2="85"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.44"
              strokeWidth="2.2"
            />

            {/* שמשה קדמית של קבינת המשאית */}
            <rect
              x={cabX + 10}
              y="23"
              width="22"
              height="52"
              rx="8.5"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.44"
              strokeWidth="1.8"
            />
            <rect
              x={cabX + 10}
              y="23"
              width="22"
              height="52"
              rx="8.5"
              fill={`url(#glass3D-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* גג מוגבה ומפוסל של מכונית */}
            <rect
              x="28"
              y="17"
              width={length - 56}
              height="62"
              rx="22"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.3"
              strokeWidth="1.8"
              filter={`url(#roofCast-${uid})`}
            />
            <rect
              x="28"
              y="17"
              width={length - 56}
              height="62"
              rx="22"
              fill={`url(#elevatedRoof-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה אחורית */}
            <rect
              x="32"
              y="29"
              width="12"
              height="39"
              rx="5.5"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.36"
              strokeWidth="1.5"
            />
            <rect
              x="32"
              y="29"
              width="12"
              height="39"
              rx="5.5"
              fill={`url(#glass3D-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה קדמית רחבה עם ברק */}
            <rect
              x={length - 49}
              y="24"
              width="20"
              height="49"
              rx="8.5"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.44"
              strokeWidth="1.8"
            />
            <rect
              x={length - 49}
              y="24"
              width="20"
              height="49"
              rx="8.5"
              fill={`url(#glass3D-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים תלת-ממדיים */}
        <g stroke="var(--vehicle-detail-edge)" strokeOpacity="0.38" strokeWidth="1.4">
          <ellipse cx={length - 15} cy="27" rx="5.8" ry="7.2" fill={`url(#lamp3D-${uid})`} />
          <ellipse cx={length - 15} cy="71" rx="5.8" ry="7.2" fill={`url(#lamp3D-${uid})`} />
        </g>

        {/* גריל קדמי קטן */}
        <rect
          x={length - 12}
          y="42"
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
