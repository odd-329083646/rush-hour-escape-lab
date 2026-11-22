import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const isTruck = car.len === 3;
  const front = length - 54;

  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        {/* גוף צעצוע עגלגל ונקי */}
        <rect
          className="vehicle-body"
          x="8"
          y="12"
          width={length - 16}
          height="76"
          rx="28"
        />

        {/* פס ברק עדין בחלק העליון */}
        <rect
          className="vehicle-body-shine"
          x="22"
          y="18"
          width={length - 44}
          height="10"
          rx="5"
        />

        {isTruck ? (
          <>
            {/* ארגז משאית עגלגל */}
            <rect
              className="vehicle-cargo"
              x="18"
              y="22"
              width={length - 86}
              height="56"
              rx="18"
            />
            <circle className="vehicle-cargo-ribs" cx="46" cy="50" r="6" />
            <circle className="vehicle-cargo-ribs" cx="80" cy="50" r="6" />
            <circle className="vehicle-cargo-ribs" cx="114" cy="50" r="6" />
          </>
        ) : (
          /* חלון צד/גג עגלגל למכונית */
          <rect
            className="vehicle-window"
            x="24"
            y="26"
            width="32"
            height="48"
            rx="16"
          />
        )}

        {/* חלון קדמי עגלגל */}
        <rect
          className="vehicle-window"
          x={front}
          y="26"
          width="24"
          height="48"
          rx="12"
        />
        <circle
          className="vehicle-window-shine"
          cx={front + 8}
          cy="38"
          r="4"
        />

        {/* פנסים קדמיים קטנים ועגולים */}
        <g className="vehicle-headlights">
          <circle cx={length - 16} cy="32" r="5" />
          <circle cx={length - 16} cy="68" r="5" />
        </g>

        {/* פנסים אחוריים קטנים */}
        <g className="vehicle-taillights">
          <rect x="13" y="28" width="5" height="11" rx="2.5" />
          <rect x="13" y="61" width="5" height="11" rx="2.5" />
        </g>
      </g>
    </svg>
  );
}
