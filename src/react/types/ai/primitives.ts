/**
 * Shared primitive types for AI integration
 * Coordinate types and the small enums reused across drawing commands.
 * Based on the architecture defined in docs/AI.md
 */

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE AND POINT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A point on the canvas with x,y coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Common fill modes for shape tools
 */
export type FillMode = "outline" | "filled" | "filled_with_outline";

/**
 * Brush/eraser shapes
 */
export type BrushShapeType = "round" | "square" | "forward_slash" | "back_slash";

/**
 * Target for transform operations
 */
export type TransformTarget = "selection" | "canvas";

/**
 * Color target (primary or secondary)
 */
export type ColorTarget = "primary" | "secondary";

/**
 * Selection mode
 */
export type SelectionMode = "opaque" | "transparent";

/**
 * Canvas anchor position for resize operations
 */
export type CanvasAnchor =
  "top-left" | "top" | "top-right" | "left" | "center" | "right" | "bottom-left" | "bottom" | "bottom-right";

/**
 * Image format types
 */
export type ImageFormat = "png" | "jpg" | "bmp" | "gif";

/**
 * Palette format types
 */
export type PaletteFormat = "pal" | "gpl" | "act" | "aco" | "colors";

/**
 * Palette presets
 */
export type PalettePreset = "windows" | "web_safe" | "grayscale" | "pastel" | "vibrant";

/**
 * Canvas units
 */
export type CanvasUnits = "pixels" | "inches" | "cm";

/**
 * Color mode
 */
export type ColorMode = "color" | "black_and_white";
