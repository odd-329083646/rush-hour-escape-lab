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
        <filter id={`lowPolyDrop-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="1.4" floodOpacity="0.42" />
        </filter>
        <linearGradient id={`topFacet-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`bottomFacet-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
        </linearGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#lowPolyDrop-${uid})`}
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
            {/* ארגז מטען של משאית Low Poly */}
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
            {/* קבינה קדמית רחבה וזוויתית */}
            <polygon
              points={`${cabX},16 ${length - 14},16 ${length - 4},27 ${length - 4},73 ${length - 14},84 ${cabX},84`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* שמשה קדמית מוגדרת */}
            <polygon
              className="vehicle-window"
              points={`${cabX + 7},26 ${cabX + 27},26 ${cabX + 30},50 ${cabX + 27},74 ${cabX + 7},74`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <>
            {/* קבינה / גוף עליון של מכונית Low Poly */}
            <polygon
              points={`24,17 ${length - 24},17 ${length - 17},26 ${length - 17},74 ${length - 24},83 24,83 17,74 17,26`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* שמשה אחורית זוויתית */}
            <polygon
              className="vehicle-window"
              points="23,26 42,26 39,74 23,74"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
            {/* פאת גג מרכזית */}
            <polygon
              points={`42,24 ${length - 42},24 ${length - 39},76 39,76`}
              fill={`url(#topFacet-${uid})`}
              pointerEvents="none"
            />
            {/* שמשה קדמית זוויתית */}
            <polygon
              className="vehicle-window"
              points={`${length - 42},26 ${length - 23},26 ${length - 23},74 ${length - 39},74`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
          </>
        )}

        {/* פנסים קדמיים צהובים בולטים */}
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
