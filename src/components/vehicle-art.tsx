import type { Car } from "@/engine/game";

/** Decorative only: the parent button owns all geometry and interactions. */
export function VehicleArt({ car }: { car: Pick<Car, "color" | "len" | "dir"> }) {
  const length = car.len * 100;
  const vertical = car.dir === "v";
  const front = length - 62;
  return (
    <svg
      className="vehicle-art"
      aria-hidden="true"
      focusable="false"
      viewBox={vertical ? `0 0 100 ${length}` : `0 0 ${length} 100`}
      style={{ color: car.color }}
    >
      <g transform={vertical ? `translate(0 ${length}) rotate(-90)` : undefined}>
        <g className="vehicle-tires">
          <rect x="28" y="3" width="30" height="16" rx="5" />
          <rect x="28" y="81" width="30" height="16" rx="5" />
          <rect x={length - 61} y="3" width="30" height="16" rx="5" />
          <rect x={length - 61} y="81" width="30" height="16" rx="5" />
        </g>
        <path className="vehicle-body" d={`M 27 10 H ${length - 32} Q ${length - 7} 10 ${length - 7} 34 V 66 Q ${length - 7} 90 ${length - 32} 90 H 27 Q 7 90 7 70 V 30 Q 7 10 27 10 Z`} />
        <path className="vehicle-body-shine" d={`M 28 15 H ${length - 33} Q ${length - 15} 15 ${length - 13} 32 H 14 Q 14 15 28 15 Z`} />
        {car.len === 3 ? (
          <>
            <rect className="vehicle-cargo" x="19" y="20" width={length - 103} height="60" rx="8" />
            <path className="vehicle-cargo-ribs" d="M 49 27 V 73 M 83 27 V 73 M 117 27 V 73 M 151 27 V 73 M 185 27 V 73" />
            <path className="vehicle-seam" d={`M ${front - 19} 15 V 85`} />
          </>
        ) : (
          <path className="vehicle-window" d="M 36 24 H 54 L 62 76 H 36 Q 28 50 36 24 Z" />
        )}
        <path className="vehicle-window" d={`M ${front} 23 H ${front + 18} Q ${front + 29} 50 ${front + 18} 77 H ${front} Z`} />
        <path className="vehicle-window-shine" d={`M ${front + 4} 28 L ${front + 16} 28 L ${front + 5} 56 Z`} />
        <path className="vehicle-seam" d={`M ${front + 34} 29 V 71`} />
        <g className="vehicle-mirrors">
          <rect x={front - 4} y="3" width="13" height="10" rx="4" />
          <rect x={front - 4} y="87" width="13" height="10" rx="4" />
        </g>
        <g className="vehicle-headlights">
          <rect x={length - 17} y="24" width="7" height="15" rx="3" />
          <rect x={length - 17} y="61" width="7" height="15" rx="3" />
        </g>
        <g className="vehicle-taillights">
          <rect x="8" y="24" width="6" height="13" rx="2" />
          <rect x="8" y="63" width="6" height="13" rx="2" />
        </g>
      </g>
    </svg>
  );
}