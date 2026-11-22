import { useId } from "react";
import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const uid = useId().replace(/:/g, "");
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const cabX = length - 74;

  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <defs>
        <filter id={`sportShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="2.6" floodOpacity="0.46" />
        </filter>
        <linearGradient id={`sportBody-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="85%" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={`sportGlass-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
          <stop offset="48%" stopColor="#38bdf8" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id={`roofShine-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      <g
        transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}
        filter={`url(#sportShadow-${uid})`}
      >
        {isTruck ? (
          <>
            {/* מראות צד למשאית */}
            <g fill="currentColor" stroke="#0f172a" strokeOpacity="0.55" strokeWidth="1.5">
              <path d={`M ${cabX + 20} 11 L ${cabX + 14} 4 L ${cabX + 24} 5 L ${cabX + 26} 11 Z`} />
              <path d={`M ${cabX + 20} 89 L ${cabX + 14} 96 L ${cabX + 24} 95 L ${cabX + 26} 89 Z`} />
            </g>

            {/* גוף משאית עם קבינה מקומרת וארגז תואם */}
            <path
              className="vehicle-body"
              d={`M 20 13 H ${cabX} Q ${cabX + 10} 10 ${cabX + 26} 10 H ${length - 26} Q ${length - 6} 10 ${length - 6} 32 V 68 Q ${length - 6} 90 ${length - 26} 90 H ${cabX + 26} Q ${cabX + 10} 90 ${cabX} 87 H 20 Q 7 87 7 70 V 30 Q 7 13 20 13 Z`}
            />
            <path
              d={`M 20 13 H ${cabX} Q ${cabX + 10} 10 ${cabX + 26} 10 H ${length - 26} Q ${length - 6} 10 ${length - 6} 32 V 68 Q ${length - 6} 90 ${length - 26} 90 H ${cabX + 26} Q ${cabX + 10} 90 ${cabX} 87 H 20 Q 7 87 7 70 V 30 Q 7 13 20 13 Z`}
              fill={`url(#sportBody-${uid})`}
              pointerEvents="none"
            />

            {/* פסי מרוץ בקדמת הקבינה בלבד (בלי לעבור על השמשה) */}
            <g fill="#ffffff" opacity="0.72" pointerEvents="none">
              <rect x={cabX + 36} y="39" width={length - cabX - 43} height="4.5" rx="2" />
              <rect x={cabX + 36} y="56.5" width={length - cabX - 43} height="4.5" rx="2" />
            </g>

            {/* ארגז מטען מוגדר ומסודר */}
            <rect
              x="14"
              y="18"
              width={cabX - 16}
              height="64"
              rx="12"
              fill="currentColor"
              fillOpacity="0.9"
              stroke="#0f172a"
              strokeOpacity="0.45"
              strokeWidth="1.8"
            />
            <rect
              x="21"
              y="24"
              width={cabX - 30}
              height="52"
              rx="8"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.26"
              strokeWidth="1.6"
              pointerEvents="none"
            />

            {/* הפרדה לקבינה */}
            <line
              x1={cabX + 2}
              y1="12"
              x2={cabX + 2}
              y2="88"
              stroke="#0f172a"
              strokeOpacity="0.55"
              strokeWidth="2.2"
            />

            {/* שמשה קדמית מעוגלת ונקייה בקבינה */}
            <path
              d={`M ${cabX + 12} 23 Q ${cabX + 35} 24 ${cabX + 38} 50 Q ${cabX + 35} 76 ${cabX + 12} 77 Q ${cabX + 16} 50 ${cabX + 12} 23 Z`}
              fill={`url(#sportGlass-${uid})`}
              stroke="#0f172a"
              strokeOpacity="0.65"
              strokeWidth="1.8"
            />

            {/* פנסים קדמיים משוכים */}
            <path
              d={`M ${length - 22} 16 Q ${length - 9} 18 ${length - 8} 30 Q ${length - 16} 28 ${length - 22} 16 Z`}
              fill="#fef08a"
              stroke="#0f172a"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <path
              d={`M ${length - 22} 84 Q ${length - 9} 82 ${length - 8} 70 Q ${length - 16} 72 ${length - 22} 84 Z`}
              fill="#fef08a"
              stroke="#0f172a"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
          </>
        ) : (
          <>
            {/* מראות צד ספורטיביות */}
            <g fill="currentColor" stroke="#0f172a" strokeOpacity="0.55" strokeWidth="1.5">
              <path d={`M ${length - 64} 11 L ${length - 70} 4 L ${length - 60} 5 L ${length - 58} 11 Z`} />
              <path d={`M ${length - 64} 89 L ${length - 70} 96 L ${length - 60} 95 L ${length - 58} 89 Z`} />
            </g>

            {/* מרכב קופה/ספורט מקומר עם בתי גלגל מודגשים */}
            <path
              className="vehicle-body"
              d={`M 22 12 Q 44 8 66 13 Q 100 16 134 13 Q 158 8 178 14 Q ${length - 5} 22 ${length - 5} 50 Q ${length - 5} 78 178 86 Q 158 92 134 87 Q 100 84 66 87 Q 44 92 22 88 Q 6 80 6 50 Q 6 20 22 12 Z`}
            />
            <path
              d={`M 22 12 Q 44 8 66 13 Q 100 16 134 13 Q 158 8 178 14 Q ${length - 5} 22 ${length - 5} 50 Q ${length - 5} 78 178 86 Q 158 92 134 87 Q 100 84 66 87 Q 44 92 22 88 Q 6 80 6 50 Q 6 20 22 12 Z`}
              fill={`url(#sportBody-${uid})`}
              pointerEvents="none"
            />

            {/* פסי מרוץ כפולים רק על החלק האחורי ומכסה המנוע (לא על השמשות) */}
            <g fill="#ffffff" opacity="0.78" pointerEvents="none">
              {/* מקטע אחורי */}
              <rect x="11" y="39" width="18" height="5" rx="2" />
              <rect x="11" y="56" width="18" height="5" rx="2" />
              {/* מקטע קדמי */}
              <rect x={length - 38} y="39" width="31" height="5" rx="2" />
              <rect x={length - 38} y="56" width="31" height="5" rx="2" />
            </g>

            {/* פתחי אוורור עדינים על מכסה המנוע */}
            <g stroke="#0f172a" strokeOpacity="0.32" strokeWidth="1.35" strokeLinecap="round" pointerEvents="none">
              <line x1={length - 35} y1="30" x2={length - 27} y2="32" />
              <line x1={length - 31} y1="33" x2={length - 23} y2="35" />
              <line x1={length - 35} y1="70" x2={length - 27} y2="68" />
              <line x1={length - 31} y1="67" x2={length - 23} y2="65" />
            </g>

            {/* שמשה אחורית נקייה ומעוגלת */}
            <path
              d="M 27 25 Q 46 23 50 50 Q 46 77 27 75 Q 32 50 27 25 Z"
              fill={`url(#sportGlass-${uid})`}
              stroke="#0f172a"
              strokeOpacity="0.65"
              strokeWidth="1.7"
            />

            {/* גג מרכזי חלק לשמירה על קריאות האות */}
            <rect
              x="54"
              y="22"
              width={length - 122}
              height="56"
              rx="22"
              fill="currentColor"
              fillOpacity="0.93"
              stroke="#0f172a"
              strokeOpacity="0.32"
              strokeWidth="1.5"
            />
            <rect
              x="54"
              y="22"
              width={length - 122}
              height="56"
              rx="22"
              fill={`url(#roofShine-${uid})`}
              pointerEvents="none"
            />

            {/* שמשה קדמית רחבה ונקייה */}
            <path
              d={`M ${length - 66} 23 Q ${length - 41} 23 ${length - 36} 50 Q ${length - 41} 77 ${length - 66} 77 Q ${length - 61} 50 ${length - 66} 23 Z`}
              fill={`url(#sportGlass-${uid})`}
              stroke="#0f172a"
              strokeOpacity="0.65"
              strokeWidth="1.8"
            />

            {/* פנסים קדמיים משוכים לאחור */}
            <path
              d={`M ${length - 27} 17 Q ${length - 10} 20 ${length - 8} 33 Q ${length - 18} 31 ${length - 27} 17 Z`}
              fill="#fef08a"
              stroke="#0f172a"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <path
              d={`M ${length - 27} 83 Q ${length - 10} 80 ${length - 8} 67 Q ${length - 18} 69 ${length - 27} 83 Z`}
              fill="#fef08a"
              stroke="#0f172a"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />

            {/* פנסים אחוריים דקים */}
            <path
              className="vehicle-taillights"
              d="M 10 24 Q 8 31 11 36"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              className="vehicle-taillights"
              d="M 10 76 Q 8 69 11 64"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        )}
      </g>
    </svg>
  );
}
