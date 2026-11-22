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
        <filter id={`sharpShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="2" floodOpacity="0.36" />
        </filter>
      </defs>

      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined} filter={`url(#sharpShadow-${uid})`}>
        {/* גוף הרכב העיקרי - פוליגון בסיס (שטוח לחלוטין) */}
        <path
          className="vehicle-body"
          d={`M 12 14 H ${length - 12} L ${length} 28 V 72 L ${length - 12} 86 H 12 L 0 72 V 28 Z`}
          stroke="var(--vehicle-detail-edge)"
          strokeWidth="1.5"
        />
        {/* משטח עליון של הגוף */}
        <path
          d={`M 12 14 H ${length - 12} L ${length - 16} 24 H 16 Z`}
          fill="currentColor"
          opacity="0.92"
          pointerEvents="none"
        />
        {/* משטח קדמי תחתון */}
        <path
          d={`M ${length} 28 L ${length - 20} 28 L ${length - 16} 24 L ${length - 8} 28 Z`}
          fill="currentColor"
          opacity="0.84"
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז מטען - בלוק Low Poly */}
            <rect
              x="16"
              y="22"
              width={cabX - 26}
              height="56"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
            {/* משטח עליון של ארגז המטען */}
            <rect
              x="20"
              y="24"
              width={cabX - 34}
              height="8"
              fill="#000000"
              opacity="0.1"
              pointerEvents="none"
            />
            {/* קבינה - בלוק Low Poly נפרד */}
            <rect
              x={cabX}
              y="26"
              width="24"
              height="48"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
            {/* גג הקבינה */}
            <rect
              x={cabX + 3}
              y="28"
              width="18"
              height="6"
              fill="#ffffff"
              opacity="0.18"
              pointerEvents="none"
            />
            {/* שמשה קדמית לקבינה (משטח אחד) */}
            <path
              className="vehicle-window"
              d={`M ${cabX + 4} 36 H ${cabX + 20} L ${cabX + 18} 66 H ${cabX + 6} Z`}
              stroke="none"
            />
          </>
        ) : (
          /* מכונית - מבנה Low Poly */
          <>
            {/* תא נוסעים / גג Low Poly */}
            <rect
              x="32"
              y="20"
              width={length - 64}
              height="60"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
            {/* גג המכונית */}
            <rect
              x="36"
              y="22"
              width={length - 72}
              height="8"
              fill="#ffffff"
              opacity="0.18"
              pointerEvents="none"
            />
            {/* שמשה אחורית */}
            <path
              className="vehicle-window"
              d={`M 33 28 H 44 L 39 72 H 33 Z`}
              stroke="none"
            />
            {/* שמשה קדמית */}
            <path
              className="vehicle-window"
              d={`M ${length - 44} 28 H ${length - 33} L ${length - 38} 72 H ${length - 44} Z`}
              stroke="none"
            />
          </>
        )}

        {/* פנסים קדמיים - משטחים צהובים חדים */}
        <g fill="#facc15" stroke="#a16207" strokeWidth="0.5">
          <rect x={length - 18} y="26" width="6" height="12" />
          <rect x={length - 18} y="62" width="6" height="12" />
        </g>

        {/* פנסים אחוריים */}
        <g className="vehicle-taillights" fill="#dc2626" stroke="#991b1b" strokeWidth="0.5">
          <rect x="14" y="26" width="4" height="10" />
          <rect x="14" y="64" width="4" height="10" />
        </g>
      </g>
    </svg>
  );
}
