/**
 * Drawing command definitions for AI integration
 * Every tool the AI can invoke, plus the `DrawingCommand` union that ties them
 * together. Based on the architecture defined in docs/AI.md
 */

import type {
  BrushShapeType,
  CanvasAnchor,
  CanvasUnits,
  ColorMode,
  ColorTarget,
  FillMode,
  ImageFormat,
  PaletteFormat,
  PalettePreset,
  Point,
  SelectionMode,
  TransformTarget,
} from "./primitives";

// ═══════════════════════════════════════════════════════════════════════════
// FREEFORM DRAWING COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pencil drawing command - draws thin lines following a path
 */
export interface PencilCommand {
  tool: "pencil";
  params: {
    /** Path as "x1,y1;x2,y2;x3,y3" compact format */
    path: string;
    /** Hex color (uses primary if omitted) */
    color?: string;
  };
}

/**
 * Brush drawing command - draws thick strokes following a path
 */
export interface BrushCommand {
  tool: "brush";
  params: {
    /** Path as "x1,y1;x2,y2;x3,y3" */
    path: string;
    /** Hex color */
    color?: string;
    /** Brush size 1-50 pixels */
    size?: number;
    /** Brush shape */
    shape?: BrushShapeType;
  };
}

/**
 * Airbrush command - spray paint effect
 *
 * The airbrush is a slow tool that accumulates paint over time.
 * The `intensity` parameter controls how many spray bursts happen per point.
 * Higher intensity = more paint accumulation (simulates holding the airbrush longer).
 */
export interface AirbrushCommand {
  tool: "airbrush";
  params: {
    /** For spraying along a path */
    path?: string;
    /** Single point spray X */
    x?: number;
    /** Single point spray Y */
    y?: number;
    /** Hex color */
    color?: string;
    /** Spray radius */
    size?: number;
    /** Spray bursts per point 1-100 (default: 20). Higher = more paint accumulation */
    intensity?: number;
  };
}

/**
 * Eraser command - erases along a path
 */
export interface EraserCommand {
  tool: "eraser";
  params: {
    /** Path as "x1,y1;x2,y2;x3,y3" */
    path: string;
    /** Eraser size */
    size?: number;
    /** Eraser shape */
    shape?: "round" | "square";
    /** Color to erase to (default: secondary color) */
    eraseToColor?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SHAPE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Line command - draws a straight line
 * Supports two parameter formats for flexibility:
 * - startX/startY/endX/endY (primary format)
 * - x1/y1/x2/y2 (alternative format from AI)
 */
export interface LineCommand {
  tool: "line";
  params: {
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    /** Alternative: start X coordinate */
    x1?: number;
    /** Alternative: start Y coordinate */
    y1?: number;
    /** Alternative: end X coordinate */
    x2?: number;
    /** Alternative: end Y coordinate */
    y2?: number;
    /** Outline color */
    color?: string;
    /** Line thickness 1-5 */
    width?: number;
    /** Alternative: line thickness */
    lineWidth?: number;
  };
}

/**
 * Rectangle command - draws a rectangle
 */
export interface RectangleCommand {
  tool: "rectangle";
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    /** Outline color */
    color?: string;
    /** Fill color (if filled) */
    fillColor?: string;
    /** Fill mode */
    fillMode?: FillMode;
    /** Line width */
    lineWidth?: number;
  };
}

/**
 * Rounded rectangle command
 */
export interface RoundedRectangleCommand {
  tool: "rounded_rectangle";
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    /** Outline color */
    color?: string;
    /** Fill color */
    fillColor?: string;
    /** Fill mode */
    fillMode?: FillMode;
    /** Corner radius */
    cornerRadius?: number;
    /** Line width */
    lineWidth?: number;
  };
}

/**
 * Ellipse command - draws an ellipse within a bounding box
 */
export interface EllipseCommand {
  tool: "ellipse";
  params: {
    /** Bounding box start X */
    startX: number;
    /** Bounding box start Y */
    startY: number;
    /** Bounding box end X */
    endX: number;
    /** Bounding box end Y */
    endY: number;
    /** Outline color */
    color?: string;
    /** Fill color */
    fillColor?: string;
    /** Fill mode */
    fillMode?: FillMode;
    /** Line width */
    lineWidth?: number;
  };
}

/**
 * Polygon command - draws a polygon with multiple vertices
 */
export interface PolygonCommand {
  tool: "polygon";
  params: {
    /** Polygon vertices */
    points: Point[];
    /** Outline color */
    color?: string;
    /** Fill color */
    fillColor?: string;
    /** Fill mode */
    fillMode?: FillMode;
    /** Auto-close polygon (default: true) */
    closed?: boolean;
    /** Line width */
    lineWidth?: number;
  };
}

/**
 * Curve command - draws a bezier curve
 */
export interface CurveCommand {
  tool: "curve";
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    /** First bend control point */
    controlPoint1: Point;
    /** Optional second bend control point */
    controlPoint2?: Point;
    /** Stroke color */
    color?: string;
    /** Line width */
    lineWidth?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FILL & COLOR TOOLS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Flood fill command - fills connected area with color
 */
export interface FillCommand {
  tool: "fill";
  params: {
    /** Start point X for flood fill */
    x: number;
    /** Start point Y for flood fill */
    y: number;
    /** Fill color (uses primary if omitted) */
    color?: string;
    /** Color matching tolerance 0-255 */
    tolerance?: number;
  };
}

/**
 * Pick color command - samples color from canvas
 */
export interface PickColorCommand {
  tool: "pick_color";
  params: {
    x: number;
    y: number;
    /** Which color to set */
    target?: ColorTarget;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT TOOL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Text command - adds text to the canvas
 */
export interface TextCommand {
  tool: "text";
  params: {
    x: number;
    y: number;
    text: string;
    /** Text color */
    color?: string;
    /** Font family e.g., "Arial", "Times New Roman" */
    fontFamily?: string;
    /** Font size in points */
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    /** Background color for opaque text */
    backgroundColor?: string;
    /** Transparent background (default: true) */
    transparent?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW/MAGNIFIER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Magnifier command - changes zoom level
 */
export interface MagnifierCommand {
  tool: "magnifier";
  params: {
    /** Center zoom on point X */
    x?: number;
    /** Center zoom on point Y */
    y?: number;
    /** Zoom level: 1, 2, 4, 6, 8 (1 = 100%) */
    zoom: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECTION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rectangular selection command
 */
export interface RectangularSelectCommand {
  tool: "select_rectangle";
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    /** Include/exclude background */
    mode?: SelectionMode;
  };
}

/**
 * Freeform selection command
 */
export interface FreeformSelectCommand {
  tool: "select_freeform";
  params: {
    /** Outline points as "x1,y1;x2,y2;..." */
    path: string;
    /** Include/exclude background */
    mode?: SelectionMode;
  };
}

/**
 * Select all command
 */
export interface SelectAllCommand {
  tool: "select_all";
  params: Record<string, never>;
}

/**
 * Deselect command
 */
export interface DeselectCommand {
  tool: "deselect";
  params: Record<string, never>;
}

/**
 * Move selection command
 */
export interface MoveSelectionCommand {
  tool: "move_selection";
  params: {
    /** Relative movement X */
    deltaX?: number;
    /** Relative movement Y */
    deltaY?: number;
    /** Absolute position X */
    toX?: number;
    /** Absolute position Y */
    toY?: number;
  };
}

/**
 * Copy selection command
 */
export interface CopySelectionCommand {
  tool: "copy";
  params: Record<string, never>;
}

/**
 * Cut selection command
 */
export interface CutSelectionCommand {
  tool: "cut";
  params: Record<string, never>;
}

/**
 * Paste command
 */
export interface PasteCommand {
  tool: "paste";
  params: {
    /** Paste position X (default: top-left) */
    x?: number;
    /** Paste position Y */
    y?: number;
  };
}

/**
 * Delete selection command - fills with secondary color
 */
export interface DeleteSelectionCommand {
  tool: "delete_selection";
  params: Record<string, never>;
}

/**
 * Crop to selection command
 */
export interface CropToSelectionCommand {
  tool: "crop_to_selection";
  params: Record<string, never>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFORM COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Flip command - flips selection or canvas
 */
export interface FlipCommand {
  tool: "flip";
  params: {
    direction: "horizontal" | "vertical";
    /** Target (default: selection if exists) */
    target?: TransformTarget;
  };
}

/**
 * Rotate command - rotates selection or canvas
 */
export interface RotateCommand {
  tool: "rotate";
  params: {
    /** Degrees clockwise */
    angle: number;
    /** Target (default: selection if exists) */
    target?: TransformTarget;
  };
}

/**
 * Stretch command - stretches selection or canvas
 */
export interface StretchCommand {
  tool: "stretch";
  params: {
    /** Horizontal stretch 1-500% */
    horizontalPercent?: number;
    /** Vertical stretch 1-500% */
    verticalPercent?: number;
    target?: TransformTarget;
  };
}

/**
 * Skew command - skews selection or canvas
 */
export interface SkewCommand {
  tool: "skew";
  params: {
    /** Horizontal skew -89 to 89 degrees */
    horizontalDegrees?: number;
    /** Vertical skew -89 to 89 degrees */
    verticalDegrees?: number;
    target?: TransformTarget;
  };
}

/**
 * Resize selection command
 */
export interface ResizeSelectionCommand {
  tool: "resize_selection";
  params: {
    width: number;
    height: number;
    maintainAspectRatio?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clear canvas/selection command
 */
export interface ClearCanvasCommand {
  tool: "clear";
  params: {
    /** Fill color (default: secondary color/white) */
    color?: string;
    /** Clear entire canvas or just selection */
    target?: "canvas" | "selection";
  };
}

/**
 * Resize canvas command
 */
export interface ResizeCanvasCommand {
  tool: "resize_canvas";
  params: {
    width: number;
    height: number;
    units?: CanvasUnits;
    anchor?: CanvasAnchor;
    /** Scale content or just resize canvas */
    resample?: boolean;
  };
}

/**
 * Set canvas attributes command
 */
export interface SetAttributesCommand {
  tool: "set_attributes";
  params: {
    width?: number;
    height?: number;
    units?: CanvasUnits;
    colorMode?: ColorMode;
    /** Use transparency vs opaque white background */
    transparent?: boolean;
    /** Default canvas color for new images */
    defaultColor?: string;
  };
}

/**
 * Get canvas attributes command
 */
export interface GetAttributesCommand {
  tool: "get_attributes";
  params: Record<string, never>;
}

/**
 * Invert colors command
 */
export interface InvertColorsCommand {
  tool: "invert_colors";
  params: {
    target?: TransformTarget;
  };
}

/**
 * Create new image command
 */
export interface NewImageCommand {
  tool: "new_image";
  params: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    transparent?: boolean;
  };
}

/**
 * Load image command
 */
export interface LoadImageCommand {
  tool: "load_image";
  params: {
    /** Load from URL */
    url?: string;
    /** Load from base64 */
    data?: string;
    format?: ImageFormat;
    /** Replace canvas or paste as selection */
    mode?: "replace" | "paste";
    /** Position if pasting */
    x?: number;
    y?: number;
  };
}

/**
 * Export image command
 */
export interface ExportImageCommand {
  tool: "export_image";
  params: {
    format: ImageFormat;
    /** JPEG quality 0-100 */
    quality?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR MANAGEMENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Set color command
 */
export interface SetColorCommand {
  tool: "set_color";
  params: {
    target: ColorTarget;
    /** Hex color "#RRGGBB" */
    color: string;
  };
}

/**
 * Swap colors command - swaps primary and secondary
 */
export interface SwapColorsCommand {
  tool: "swap_colors";
  params: Record<string, never>;
}

/**
 * Set palette color command
 */
export interface SetPaletteColorCommand {
  tool: "set_palette_color";
  params: {
    /** Palette position 0-27 */
    index: number;
    /** Hex color */
    color: string;
  };
}

/**
 * Set custom color command
 */
export interface SetCustomColorCommand {
  tool: "set_custom_color";
  params: {
    /** Custom color slot 0-15 */
    slot: number;
    /** Hex color "#RRGGBB" */
    color: string;
  };
}

/**
 * Get custom colors command
 */
export interface GetCustomColorsCommand {
  tool: "get_custom_colors";
  params: Record<string, never>;
}

/**
 * Define color command - create a color using RGB or HSL
 */
export interface DefineColorCommand {
  tool: "define_color";
  params: {
    /** Hex color "#RRGGBB" */
    hex?: string;
    /** RGB red 0-255 */
    red?: number;
    /** RGB green 0-255 */
    green?: number;
    /** RGB blue 0-255 */
    blue?: number;
    /** HSL hue 0-239 (MS Paint scale) */
    hue?: number;
    /** HSL saturation 0-240 */
    saturation?: number;
    /** HSL luminosity 0-240 */
    luminosity?: number;
    /** Save to custom color slot 0-15 */
    saveToCustomSlot?: number;
    /** Set as primary color */
    setAsPrimary?: boolean;
    /** Set as secondary color */
    setAsSecondary?: boolean;
  };
}

/**
 * Sample color command - programmatic eyedropper
 */
export interface SampleColorCommand {
  tool: "sample_color";
  params: {
    x: number;
    y: number;
    setAsPrimary?: boolean;
    setAsSecondary?: boolean;
    saveToCustomSlot?: number;
    /** Return hex value in response */
    returnValue?: boolean;
  };
}

/**
 * Load palette command
 */
export interface LoadPaletteCommand {
  tool: "load_palette";
  params: {
    format?: PaletteFormat;
    /** Base64 encoded palette file */
    data?: string;
    /** Use preset palette */
    preset?: PalettePreset;
  };
}

/**
 * Save palette command
 */
export interface SavePaletteCommand {
  tool: "save_palette";
  params: {
    format: "pal" | "gpl";
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EDIT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Undo command
 */
export interface UndoCommand {
  tool: "undo";
  params: {
    /** Number of steps to undo (default: 1) */
    steps?: number;
  };
}

/**
 * Redo command
 */
export interface RedoCommand {
  tool: "redo";
  params: {
    /** Number of steps to redo (default: 1) */
    steps?: number;
  };
}

/**
 * Repeat last action command
 */
export interface RepeatCommand {
  tool: "repeat";
  params: {
    /** Repeat N times */
    times?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH & COMPOSITE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Batch shapes command - draw many shapes of the same type efficiently
 */
export interface BatchShapesCommand {
  tool: "batch_shapes";
  params: {
    shapeType: "rectangle" | "ellipse" | "line";
    shapes: Array<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }>;
    color?: string;
    fillColor?: string;
    fillMode?: FillMode;
  };
}

/**
 * Batch points command - draw many individual pixels efficiently
 */
export interface BatchPointsCommand {
  tool: "batch_points";
  params: {
    /** Points as "x1,y1;x2,y2;..." */
    points: string;
    color?: string;
  };
}

/**
 * Pattern repeat command - repeat a set of commands as a pattern
 */
export interface PatternRepeatCommand {
  tool: "pattern_repeat";
  params: {
    /** Commands to repeat */
    commands: DrawingCommand[];
    /** Times to repeat horizontally */
    repeatX: number;
    /** Times to repeat vertically */
    repeatY: number;
    /** X spacing between repeats */
    offsetX: number;
    /** Y spacing between repeats */
    offsetY: number;
  };
}

/**
 * Draw grid command - draw a grid efficiently
 */
export interface DrawGridCommand {
  tool: "draw_grid";
  params: {
    startX: number;
    startY: number;
    cols: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    color?: string;
    lineWidth?: number;
  };
}

/**
 * Draw SVG-style path command
 */
export interface DrawPathCommand {
  tool: "draw_path";
  params: {
    /** SVG path: "M 10 10 L 50 50 Q 100 100 150 50 Z" */
    d: string;
    color?: string;
    fillColor?: string;
    lineWidth?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UNION TYPE OF ALL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Union type of all drawing commands
 */
export type DrawingCommand =
  // Freeform drawing
  | PencilCommand
  | BrushCommand
  | AirbrushCommand
  | EraserCommand
  // Shapes
  | LineCommand
  | RectangleCommand
  | RoundedRectangleCommand
  | EllipseCommand
  | PolygonCommand
  | CurveCommand
  // Fill & Color tools
  | FillCommand
  | PickColorCommand
  // Text
  | TextCommand
  // View
  | MagnifierCommand
  // Selection
  | RectangularSelectCommand
  | FreeformSelectCommand
  | SelectAllCommand
  | DeselectCommand
  | MoveSelectionCommand
  | CopySelectionCommand
  | CutSelectionCommand
  | PasteCommand
  | DeleteSelectionCommand
  | CropToSelectionCommand
  // Transform
  | FlipCommand
  | RotateCommand
  | StretchCommand
  | SkewCommand
  | ResizeSelectionCommand
  // Canvas operations
  | ClearCanvasCommand
  | ResizeCanvasCommand
  | SetAttributesCommand
  | GetAttributesCommand
  | InvertColorsCommand
  | NewImageCommand
  | LoadImageCommand
  | ExportImageCommand
  // Color management
  | SetColorCommand
  | SwapColorsCommand
  | SetPaletteColorCommand
  | SetCustomColorCommand
  | GetCustomColorsCommand
  | DefineColorCommand
  | SampleColorCommand
  | LoadPaletteCommand
  | SavePaletteCommand
  // Edit operations
  | UndoCommand
  | RedoCommand
  | RepeatCommand
  // Batch commands
  | BatchShapesCommand
  | BatchPointsCommand
  | PatternRepeatCommand
  | DrawGridCommand
  | DrawPathCommand;

/**
 * All possible tool names
 */
export type ToolName = DrawingCommand["tool"];
