import { useId } from "react";
import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const uid = useId().replace(/:/g, "");
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const cabX = length - 64;

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
          <feDropShadow dx="0" dy="4" stdDeviation="1.5" floodOpacity="0.4" />
        </filter>
        <linearGradient id={`facetDark-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`facetLight-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#polyShadow-${uid})`}
      >
        {/* גוף Low Poly זוויתי */}
        <polygon
          className="vehicle-body"
          points={`10,14 ${length - 10},14 ${length},26 ${length},74 ${length - 10},86 10,86 0,74 0,26`}
          stroke="var(--vehicle-detail-edge)"
          strokeWidth="2"
        />

        {/* הצללת פאות תחתונה ועליונה ליצירת נפח Low Poly */}
        <polygon
          points={`10,14 ${length - 10},14 ${length - 14},22 14,22`}
          fill={`url(#facetLight-${uid})`}
          pointerEvents="none"
        />
        <polygon
          points={`0,74 ${length},74 ${length - 10},86 10,86`}
          fill={`url(#facetDark-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית Low Poly מובחן */}
            <polygon
              points={`14,20 ${cabX - 8},20 ${cabX - 8},80 14,80`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* דופן פנימית כהה לארגז */}
            <polygon
              points={`20,26 ${cabX - 14},26 ${cabX - 14},74 20,74`}
              fill="#000000"
              fillOpacity="0.16"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
            {/* קבינה קדמית של המשאית */}
            <polygon
              points={`${cabX - 2},18 ${length - 14},18 ${length - 6},28 ${length - 6},72 ${length - 14},82 ${cabX - 2},82`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* שמשה קדמית של הקבינה */}
            <polygon
              className="vehicle-window"
              points={`${cabX + 5},28 ${cabX + 23},28 ${cabX + 25},50 ${cabX + 23},72 ${cabX + 5},72`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <>
            {/* קבינה / גג מכונית Low Poly */}
            <polygon
              points={`26,18 ${length - 26},18 ${length - 20},27 ${length - 20},73 ${length - 26},82 26,82 20,73 20,27`}
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="2"
            />
            {/* שמשה אחורית */}
            <polygon
              className="vehicle-window"
              points="26,27 42,27 40,73 26,73"
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
            {/* שמשה קדמית */}
            <polygon
              className="vehicle-window"
              points={`${length - 42},27 ${length - 26},27 ${length - 26},73 ${length - 40},73`}
              stroke="var(--vehicle-detail-edge)"
              strokeWidth="1.5"
            />
          </>
        )}

        {/* פנסים קדמיים צהובים בולטים */}
        <g fill="#facc15" stroke="#854d0e" strokeWidth="1">
          <polygon points={`${length - 16},22 ${length - 8},22 ${length - 8},35 ${length - 16},35`} />
          <polygon points={`${length - 16},65 ${length - 8},65 ${length - 8},78 ${length - 16},78`} />
        </g>

        {/* פנסים אחוריים */}
        <g className="vehicle-taillights" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1">
          <polygon points="8,24 14,24 14,35 8,35" />
          <polygon points="8,65 14,65 14,76 8,76" />
        </g>
      </g>
    </svg>
  );
}
