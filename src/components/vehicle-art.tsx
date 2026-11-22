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
          <feDropShadow dx="0" dy="4" stdDeviation="2.5" floodOpacity="0.42" />
        </filter>
        <linearGradient id={`bodyShade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="52%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={`topHighlight-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id={`windshield-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.34" />
        </linearGradient>
        <radialGradient id={`headlight-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0.88" />
        </radialGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#toyShadow-${uid})`}
      >
        {/* מראות צד מעודנות */}
        <g
          fill="currentColor"
          stroke="var(--vehicle-detail-edge)"
          strokeOpacity="0.45"
          strokeWidth="1.6"
        >
          <ellipse cx={length - 48} cy="9.5" rx="6" ry="3.5" />
          <ellipse cx={length - 48} cy="90.5" rx="6" ry="3.5" />
        </g>

        {/* גוף ראשי עגלגל ושמנמן */}
        <path
          className="vehicle-body"
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
        />
        <path
          d={`M 26 11 H ${length - 26} Q ${length - 7} 11 ${length - 7} 32 V 68 Q ${length - 7} 89 ${length - 26} 89 H 26 Q 7 89 7 68 V 32 Q 7 11 26 11 Z`}
          fill={`url(#bodyShade-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* מכולה / ארגז משאית מובחן */}
            <rect
              x="14"
              y="17"
              width={cabX - 14}
              height="66"
              rx="14"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.35"
              strokeWidth="1.8"
            />
            <rect
              x="14"
              y="17"
              width={cabX - 14}
              height="66"
              rx="14"
              fill={`url(#topHighlight-${uid})`}
              pointerEvents="none"
            />
            {/* פסי ארגז אחידים ומסודרים */}
            <g
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.22"
              strokeWidth="2.2"
              pointerEvents="none"
            >
              <line x1="36" y1="22" x2="36" y2="78" />
              <line x1="62" y1="22" x2="62" y2="78" />
              <line x1="88" y1="22" x2="88" y2="78" />
            </g>

            {/* קו חיבור נקי לקבינה */}
            <line
              x1={cabX + 2}
              y1="14"
              x2={cabX + 2}
              y2="86"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.4"
              strokeWidth="2"
            />

            {/* שמשה קדמית של קבינת המשאית */}
            <rect
              x={cabX + 10}
              y="24"
              width="22"
              height="52"
              rx="8"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.42"
              strokeWidth="1.8"
            />
            <rect
              x={cabX + 10}
              y="24"
              width="22"
              height="52"
              rx="8"
              fill={`url(#windshield-${uid})`}
              pointerEvents="none"
            />
          </>
        ) : (
          <>
            {/* שמשה אחורית מעודנת */}
            <rect
              x="30"
              y="28"
              width="13"
              height="44"
              rx="5.5"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.35"
              strokeWidth="1.6"
            />
            <rect
              x="30"
              y="28"
              width="13"
              height="44"
              rx="5.5"
              fill={`url(#windshield-${uid})`}
              pointerEvents="none"
            />

            {/* גג מעוגל נקי במרכז */}
            <rect
              x="48"
              y="21"
              width={length - 102}
              height="58"
              rx="18"
              fill={`url(#topHighlight-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה קדמית רחבה ומעוגלת */}
            <rect
              x={length - 49}
              y="25"
              width="20"
              height="50"
              rx="8"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.42"
              strokeWidth="1.8"
            />
            <rect
              x={length - 49}
              y="25"
              width="20"
              height="50"
              rx="8"
              fill={`url(#windshield-${uid})`}
              pointerEvents="none"
            />
          </>
        )}

        {/* פנסים קדמיים */}
        <g stroke="var(--vehicle-detail-edge)" strokeOpacity="0.35" strokeWidth="1.4">
          <ellipse cx={length - 15} cy="28" rx="5.5" ry="7" fill={`url(#headlight-${uid})`} />
          <ellipse cx={length - 15} cy="72" rx="5.5" ry="7" fill={`url(#headlight-${uid})`} />
        </g>

        {/* גריל קדמי קטן */}
        <rect
          x={length - 12}
          y="43"
          width="3.5"
          height="14"
          rx="1.75"
          fill="#0f172a"
          opacity="0.42"
        />
      </g>
    </svg>
  );
}
