import React from "react";
import { AIRBRUSH_SIZES } from "../../data/toolOptionsData";

interface AirbrushSizeOptionsProps {
  airbrushSize: number;
  onAirbrushSizeChange: (size: number) => void;
}

/**
 * Draw airbrush spray pattern - random dots in a circular area
 * @param ctx - Canvas context
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Spray radius
 * @param color - Dot color
 * @param density - Number of dots to draw
 */
function drawSprayPattern(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  density: number,
) {
  ctx.fillStyle = color;
  // Use fixed seed-like pattern for consistent display
  for (let i = 0; i < density; i++) {
    const angle = (i / density) * Math.PI * 2 + (i * 2.39996); // Golden angle for even distribution
    const r = (radius * Math.sqrt((i % 7) / 7 + 0.3));
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
}

/**
 * Airbrush size options for Airbrush tool
 * Displays 3 spray pattern sizes in a column layout to fit 41x66px tool-options container
 */
export function AirbrushSizeOptions({ airbrushSize, onAirbrushSizeChange }: AirbrushSizeOptionsProps) {
  // Canvas dimensions to fit in tool-options (41x66px)
  const canvasWidth = 35;
  const canvasHeight = 18;

  return (
    <div className="chooser choose-airbrush-size">
      {AIRBRUSH_SIZES.map((size, i) => {
        const isSelected = airbrushSize === size;
        // Map size to visual radius (small, medium, large)
        const visualRadius = 3 + i * 2.5; // 3, 5.5, 8
        const density = 8 + i * 6; // 8, 14, 20 dots

        return (
          <div
            key={size}
            className="chooser-option"
            onClick={() => onAirbrushSizeChange(size)}
            style={{
              backgroundColor: isSelected ? "var(--Hilight, #000080)" : "rgb(192, 192, 192)",
            }}
          >
            <canvas
              key={`airbrush-${size}-${isSelected}`}
              width={canvasWidth}
              height={canvasHeight}
              ref={(canvas) => {
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                const color = isSelected ? "#ffffff" : "#000000";
                drawSprayPattern(ctx, canvasWidth / 2, canvasHeight / 2, visualRadius, color, density);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
