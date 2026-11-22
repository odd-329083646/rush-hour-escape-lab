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
        <linearGradient id={`shellGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={`cabinGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`winGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.96" />
        </linearGradient>
      </defs>

      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        {/* צל רך מתחת לרכב */}
        <rect
          x="10"
          y="18"
          width={length - 20}
          height="74"
          rx="20"
          fill="#000000"
          opacity="0.36"
        />

        {/* גלגלים כהים שמבצבצים מהצדדים */}
        <g fill="#1e293b" stroke="#0f172a" strokeWidth="2">
          <rect x="24" y="4" width="24" height="12" rx="5" />
          <rect x="24" y="84" width="24" height="12" rx="5" />
          <rect x={length - 48} y="4" width="24" height="12" rx="5" />
          <rect x={length - 48} y="84" width="24" height="12" rx="5" />
        </g>

        {/* גוף עיקרי קובייתי-מעוגל */}
        <rect
          x="10"
          y="12"
          width={length - 20}
          height="74"
          rx="18"
          fill="currentColor"
          stroke="var(--vehicle-detail-edge)"
          strokeOpacity="0.4"
          strokeWidth="2"
        />
        <rect
          x="10"
          y="12"
          width={length - 20}
          height="74"
          rx="18"
          fill={`url(#shellGrad-${uid})`}
          pointerEvents="none"
        />

        {isTruck ? (
          <>
            {/* ארגז מטען גבוה ומובחן של משאית */}
            <rect
              x="16"
              y="18"
              width={cabX - 22}
              height="62"
              rx="11"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.35"
              strokeWidth="2"
            />
            <rect
              x="16"
              y="18"
              width={cabX - 22}
              height="62"
              rx="11"
              fill={`url(#cabinGrad-${uid})`}
              pointerEvents="none"
            />
            {/* הפרדה לקבינה הקדמית */}
            <line
              x1={cabX - 2}
              y1="14"
              x2={cabX - 2}
              y2="84"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.4"
              strokeWidth="2.5"
            />
            {/* שמשה קדמית כהה לקבינה */}
            <rect
              x={cabX + 6}
              y="26"
              width="20"
              height="46"
              rx="7"
              fill={`url(#winGrad-${uid})`}
            />
          </>
        ) : (
          <>
            {/* גג / תא נוסעים מובחן במכונית */}
            <rect
              x="28"
              y="18"
              width={length - 56}
              height="62"
              rx="14"
              fill="currentColor"
              stroke="var(--vehicle-detail-edge)"
              strokeOpacity="0.32"
              strokeWidth="2"
            />
            <rect
              x="28"
              y="18"
              width={length - 56}
              height="62"
              rx="14"
              fill={`url(#cabinGrad-${uid})`}
              pointerEvents="none"
            />
            {/* שמשה אחורית ושמשה קדמית */}
            <rect
              x="33"
              y="26"
              width="12"
              height="46"
              rx="5"
              fill={`url(#winGrad-${uid})`}
            />
            <rect
              x={length - 45}
              y="26"
              width="13"
              height="46"
              rx="5.5"
              fill={`url(#winGrad-${uid})`}
            />
          </>
        )}

        {/* פנסים קדמיים צהובים בולטים */}
        <g fill="#facc15" stroke="#ca8a04" strokeWidth="1.2">
          <rect x={length - 16} y="22" width="6" height="13" rx="2.5" />
          <rect x={length - 16} y="63" width="6" height="13" rx="2.5" />
        </g>

        {/* פנסים אחוריים עדינים */}
        <g className="vehicle-taillights">
          <rect x="12" y="25" width="4" height="11" rx="2" />
          <rect x="12" y="62" width="4" height="11" rx="2" />
        </g>
      </g>
    </svg>
  );
}
