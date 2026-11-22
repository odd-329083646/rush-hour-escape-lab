import { useId } from "react";
import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const uid = useId().replace(/:/g, "");
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const cabX = length - 72;

  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <defs>
        <filter id={`lowPolyShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="1.4" floodOpacity="0.42" />
        </filter>
        <linearGradient id={`topFacet-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`bottomFacet-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
        </linearGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#lowPolyShadow-${uid})`}
      >
        {/* בסיס גוף Low Poly זוויתי */}
        <polygon
          className="vehicle-body"
          points={`12,12 ${length - 12},12 ${length},25 ${length},75 ${length - 12},88 12,88 0,75 0,25`}
          stroke="var(--vehicle-detail-edge)"
          strokeWidth="2"
        />

        {/* פאה עליונה מוארת ופאה תחתונה מוצללת */}
        <polygon
          points={`12,12 ${length - 12},12 ${length - 18},22 18,22`}
          fill={`url(#topFacet-${uid})`}
          pointerEvents="none"
        />
        <polygon
          points={`0,75 ${length},75 ${length - 12},88 12,88`}
          fill={`url(#bottomFacet-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית Low Poly */}
            <polygon
              points={`12,18 ${cabX - 6},18 ${cabX - 6},82 12,82 6,74 6,26`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* עומק פנימי של ארגז המטען */}
            <polygon
              points={`18,24 ${cabX - 12},24 ${cabX - 12},76 18,76`}
              fill="#000000"
              fillOpacity="0.2"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.4"
              strokeWidth="1.5"
            />
            {/* קבינה קדמית נפרדת ומובחנת */}
            <polygon
              points={`${cabX},16 ${length - 14},16 ${length - 4},27 ${length - 4},73 ${length - 14},84 ${cabX},84`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* שמשה קדמית נקייה */}
            <polygon
              className="vehicle-window"
              points={`${cabX + 7},28 ${cabX + 23},28 ${cabX + 25},72 ${cabX + 7},72`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.6"
            />
          </>
        ) : (
          <>
            {/* קבינה מרכזית של מכונית Low Poly */}
            <polygon
              points={`22,16 ${length - 22},16 ${length - 15},26 ${length - 15},74 ${length - 22},84 22,84 15,74 15,26`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* שמשה אחורית נקייה */}
            <polygon
              className="vehicle-window"
              points="23,28 36,28 34,72 23,72"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.6"
            />
            {/* גג מרכזי זוויתי */}
            <polygon
              points={`36,23 ${length - 36},23 ${length - 34},77 34,77`}
              fill={`url(#topFacet-${uid})`}
              pointerEvents="none"
            />
            {/* שמשה קדמית נקייה */}
            <polygon
              className="vehicle-window"
              points={`${length - 36},28 ${length - 23},28 ${length - 23},72 ${length - 34},72`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.6"
            />
          </>
        )}

        {/* פנסים קדמיים צהובים */}
        <g fill="#facc15" stroke="#854d0e" strokeWidth="1">
          <polygon points={`${length - 15},21 ${length - 6},21 ${length - 6},35 ${length - 15},35`} />
          <polygon points={`${length - 15},65 ${length - 6},65 ${length - 6},79 ${length - 15},79`} />
        </g>

        {/* פנסים אחוריים */}
        <g className="vehicle-taillights" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1">
          <polygon points="6,23 13,23 13,35 6,35" />
          <polygon points="6,65 13,65 13,77 6,77" />
        </g>
      </g>
    </svg>
  );
}
