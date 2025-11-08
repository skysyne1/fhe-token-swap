import { useEffect, useState } from "react";

interface Dice3DProps {
  value: number;
  size: number;
  isRolling: boolean;
  showGlow?: boolean;
}

export function Dice3D({ value, size, isRolling, showGlow }: Dice3DProps) {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    if (!isRolling) {
      setCurrentValue(value);
    }
  }, [isRolling, value]);

  // Face rotation based on dice value
  const rotations: Record<number, string> = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateX(0deg) rotateY(180deg)",
    3: "rotateX(0deg) rotateY(90deg)",
    4: "rotateX(0deg) rotateY(-90deg)",
    5: "rotateX(90deg) rotateY(0deg)",
    6: "rotateX(-90deg) rotateY(0deg)",
  };

  return (
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: "1000px",
      }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-1000 ${
          isRolling ? "animate-[roll_1s_ease-in-out]" : "animate-[float_3s_ease-in-out_infinite]"
        } ${showGlow ? "animate-[glow_2s_ease-in-out_infinite]" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: isRolling ? "" : rotations[currentValue],
        }}
      >
        {/* Face 1 - Front */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-white to-gray-100 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center"
          style={{
            transform: `translateZ(${size / 2}px)`,
          }}
        >
          <DiceDots value={1} size={size} />
        </div>

        {/* Face 2 - Back */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-white to-gray-100 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center"
          style={{
            transform: `rotateY(180deg) translateZ(${size / 2}px)`,
          }}
        >
          <DiceDots value={2} size={size} />
        </div>

        {/* Face 3 - Right */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-white to-gray-100 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center"
          style={{
            transform: `rotateY(90deg) translateZ(${size / 2}px)`,
          }}
        >
          <DiceDots value={3} size={size} />
        </div>

        {/* Face 4 - Left */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-white to-gray-100 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center"
          style={{
            transform: `rotateY(-90deg) translateZ(${size / 2}px)`,
          }}
        >
          <DiceDots value={4} size={size} />
        </div>

        {/* Face 5 - Top */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-white to-gray-100 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center"
          style={{
            transform: `rotateX(90deg) translateZ(${size / 2}px)`,
          }}
        >
          <DiceDots value={5} size={size} />
        </div>

        {/* Face 6 - Bottom */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-white to-gray-100 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center"
          style={{
            transform: `rotateX(-90deg) translateZ(${size / 2}px)`,
          }}
        >
          <DiceDots value={6} size={size} />
        </div>
      </div>
    </div>
  );
}

function DiceDots({ value, size }: { value: number; size: number }) {
  const dotSize = size * 0.15;
  const gap = size * 0.08;

  const dotPositions: Record<number, { row: number; col: number }[]> = {
    1: [{ row: 1, col: 1 }],
    2: [
      { row: 0, col: 0 },
      { row: 2, col: 2 },
    ],
    3: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ],
    4: [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ],
    5: [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ],
    6: [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ],
  };

  return (
    <div
      className="grid grid-cols-3 grid-rows-3"
      style={{
        width: `${size * 0.7}px`,
        height: `${size * 0.7}px`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hasDot = dotPositions[value]?.some(pos => pos.row === row && pos.col === col);

        return (
          <div key={i} className="flex items-center justify-center">
            {hasDot && (
              <div
                className="rounded-full bg-black shadow-inner"
                style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
