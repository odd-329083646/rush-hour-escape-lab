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
        <filter id={`polyShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="1.5" floodOpacity="0.45" />
        </filter>
        <linearGradient id={`topLight-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`bottomShade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
        </linearGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#polyShadow-${uid})`}
      >
        {/* שלד גוף Low Poly מחודד */}
        <polygon
          className="vehicle-body"
          points={`14,10 ${length - 14},10 ${length},24 ${length},76 ${length - 14},90 14,90 0,76 0,24`}
          stroke="var(--vehicle-detail-edge)"
          strokeWidth="2.2"
        />

        {/* הצללה תחתונה ועליונה ליצירת זוויתיות */}
        <polygon
          points={`14,10 ${length - 14},10 ${length - 20},20 20,20`}
          fill={`url(#topLight-${uid})`}
          pointerEvents="none"
        />
        <polygon
          points={`0,76 ${length},76 ${length - 14},90 14,90`}
          fill={`url(#bottomShade-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית עמוק */}
            <polygon
              points={`10,16 ${cabX - 6},16 ${cabX - 6},84 10,84 4,76 4,24`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2.2"
            />
            {/* עומק ארגז פנימי כהה */}
            <polygon
              points={`16,22 ${cabX - 12},22 ${cabX - 12},78 16,78`}
              fill="#000000"
              fillOpacity="0.24"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
            {/* קבינה קדמית נפרדת ומובחנת */}
            <polygon
              points={`${cabX},14 ${length - 12},14 ${length - 3},26 ${length - 3},74 ${length - 12},86 ${cabX},86`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2.2"
            />
            {/* שמשה קדמית בולטת */}
            <polygon
              className="vehicle-window"
              points={`${cabX + 7},24 ${cabX + 29},24 ${cabX + 33},50 ${cabX + 29},76 ${cabX + 7},76`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.8"
            />
          </>
        ) : (
          <>
            {/* קבינה מרכזית בולטת של מכונית */}
            <polygon
              points={`22,15 ${length - 22},15 ${length - 14},25 ${length - 14},75 ${length - 22},85 22,85 14,75 14,25`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2.2"
            />
            {/* שמשה אחורית רחבה */}
            <polygon
              className="vehicle-window"
              points="21,25 46,25 42,75 21,75"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.8"
            />
            {/* גג מרכזי זוויתי */}
            <polygon
              points={`46,22 ${length - 46},22 ${length - 42},78 42,78`}
              fill={`url(#topLight-${uid})`}
              pointerEvents="none"
            />
            {/* שמשה קדמית רחבה */}
            <polygon
              className="vehicle-window"
              points={`${length - 46},25 ${length - 21},25 ${length - 21},75 ${length - 42},75`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.8"
            />
          </>
        )}

        {/* פנסים קדמיים צהובים */}
        <g fill="#facc15" stroke="#854d0e" strokeWidth="1.2">
          <polygon points={`${length - 14},20 ${length - 5},20 ${length - 5},35 ${length - 14},35`} />
          <polygon points={`${length - 14},65 ${length - 5},65 ${length - 5},80 ${length - 14},80`} />
        </g>

        {/* פנסים אחוריים */}
        <g className="vehicle-taillights" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.2">
          <polygon points="5,22 13,22 13,35 5,35" />
          <polygon points="5,65 13,65 13,78 5,78" />
        </g>
      </g>
    </svg>
  );
}
