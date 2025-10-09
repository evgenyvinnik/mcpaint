import React, { Fragment, useMemo } from "react";

/** @typedef {import("./ToolBox.jsx").Tool} Tool */

const STROKE_SIZE_ITEMS = [1, 2, 4, 8];
const BRUSH_SIZE_ITEMS = [2, 4, 6, 8];
const AIRBRUSH_SIZE_ITEMS = [10, 20, 30];
const ERASER_SIZE_ITEMS = [4, 8, 16];

const BRUSH_SHAPE_ITEMS = [
        { id: "round", label: "Round brush", render: () => (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <circle cx="8" cy="8" r="5" fill="currentColor" />
                </svg>
        ) },
        { id: "square", label: "Square brush", render: () => (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <rect x="4" y="4" width="8" height="8" fill="currentColor" />
                </svg>
        ) },
        { id: "diagonal", label: "Diagonal brush", render: () => (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <line x1="4" y1="12" x2="12" y2="4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
        ) },
];

const FILL_STYLE_ITEMS = [
        { id: "outline", label: "Outline", render: () => (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
        ) },
        { id: "filled", label: "Filled", render: () => (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <rect x="3" y="3" width="10" height="10" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                </svg>
        ) },
        { id: "outline-fill", label: "Outline and fill", render: () => (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <rect x="3" y="3" width="10" height="10" fill="currentColor" fillOpacity="0.4" />
                        <rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
        ) },
];

const MAGNIFIER_ZOOM_ITEMS = [1, 2, 4, 8].map((zoom) => ({
        id: `${zoom}x`,
        value: zoom,
        label: `${zoom}× zoom`,
}));

const SELECTION_MODE_ITEMS = [
        { id: "transparent", label: "Transparent selection", text: "T" },
        { id: "opaque", label: "Opaque selection", text: "O" },
];

const TEXT_BACKGROUND_ITEMS = [
        { id: "transparent", label: "Transparent background", text: "T" },
        { id: "opaque", label: "Opaque background", text: "O" },
];

export const TOOL_OPTIONS_DEFAULTS = {
        pencil: { size: 1 },
        brush: { size: 4, shape: "round" },
        airbrush: { size: 20 },
        eraser: { size: 8 },
        line: { size: 1 },
        curve: { size: 1 },
        rectangle: { fillStyle: "outline" },
        polygon: { fillStyle: "outline" },
        ellipse: { fillStyle: "outline" },
        "rounded-rectangle": { fillStyle: "outline" },
        magnifier: { zoom: 2 },
        select: { selectionMode: "transparent" },
        "free-form-select": { selectionMode: "transparent" },
        text: { background: "transparent", family: "Arial", size: 12, bold: false, italic: false, underline: false, vertical: false },
};

export const TOOL_OPTIONS_SUMMARY_LABELS = {
        fillStyle: {
                outline: "Outline",
                filled: "Filled",
                "outline-fill": "Outline and Fill",
        },
        shape: {
                round: "Round",
                square: "Square",
                diagonal: "Diagonal",
        },
        selectionMode: {
                transparent: "Transparent",
                opaque: "Opaque",
        },
        background: {
                transparent: "Transparent",
                opaque: "Opaque",
        },
};

/**
 * Create a deep-ish copy of the default tool settings map.
 * @returns {Record<string, any>}
 */
export function createInitialToolSettings() {
        /** @type {Record<string, any>} */
        const result = {};
        for (const [toolId, defaults] of Object.entries(TOOL_OPTIONS_DEFAULTS)) {
                result[toolId] = { ...defaults };
        }
        return result;
}

/**
 * Helper button group renderer for compact option controls.
 *
 * @template T
 * @param {object} props
 * @param {{ id: string; value?: T; label: string; render?: () => import("react").ReactNode; text?: string; width?: number }[]} props.items
 * @param {T | string | number | undefined} props.selected
 * @param {(value: T | string | number) => void} props.onSelect
 * @param {string} props.ariaLabel
 * @returns {import("react").ReactElement}
 */
function OptionButtons({ items, selected, onSelect, ariaLabel }) {
        return (
                <div className="tool-option-buttons" role="radiogroup" aria-label={ariaLabel}>
                        {items.map((item) => {
                                const value = item.value ?? item.id;
                                const isSelected = selected === value;
                                const style = item.width ? { width: item.width, minWidth: item.width } : undefined;
                                return (
                                        <button
                                                key={item.id}
                                                type="button"
                                                className={["tool-option-button", isSelected ? "selected" : ""].filter(Boolean).join(" ")}
                                                aria-label={item.label}
                                                aria-pressed={isSelected}
                                                style={style}
                                                onClick={() => onSelect(value)}
                                        >
                                                {item.render ? item.render() : (
                                                        <span className="tool-option-text" aria-hidden="true">{item.text ?? item.id}</span>
                                                )}
                                        </button>
                                );
                        })}
                </div>
        );
}

/**
 * Render stroke size options represented by a line in a square button.
 *
 * @param {object} props
 * @param {number[]} props.items
 * @param {number} props.selected
 * @param {(value: number) => void} props.onSelect
 * @param {string} props.ariaLabel
 * @returns {import("react").ReactElement}
 */
function StrokeSizeButtons({ items, selected, onSelect, ariaLabel }) {
        return (
                <OptionButtons
                        items={items.map((size) => ({
                                id: `${size}`,
                                value: size,
                                label: `${size} pixel${size === 1 ? "" : "s"}`,
                                render: () => (
                                        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                                                <line
                                                        x1="3"
                                                        x2="13"
                                                        y1="8"
                                                        y2="8"
                                                        stroke="currentColor"
                                                        strokeWidth={size}
                                                        strokeLinecap="round"
                                                />
                                        </svg>
                                ),
                        }))}
                        selected={selected}
                        onSelect={(value) => onSelect(typeof value === "number" ? value : Number(value))}
                        ariaLabel={ariaLabel}
                />
        );
}

/**
 * Describe tool settings for status text.
 *
 * @param {string} toolId
 * @param {Record<string, any>} settings
 * @returns {string}
 */
export function describeToolOptions(toolId, settings = {}) {
        if (!toolId) {
                return "";
        }
        const mergedSettings = {
                ...TOOL_OPTIONS_DEFAULTS[toolId],
                ...settings,
        };
        switch (toolId) {
                case "pencil":
                case "line":
                case "curve":
                        return `Size ${mergedSettings.size}px`;
                case "brush": {
                        const shape = mergedSettings.shape;
                        const shapeLabel = TOOL_OPTIONS_SUMMARY_LABELS.shape?.[shape] ?? shape;
                        return `Brush ${mergedSettings.size}px ${shapeLabel ?? ""}`.trim();
                }
                case "airbrush":
                        return `Spray ${mergedSettings.size}px`;
                case "eraser":
                        return `Eraser ${mergedSettings.size}px`;
                case "rectangle":
                case "polygon":
                case "ellipse":
                case "rounded-rectangle": {
                        const fillStyle = mergedSettings.fillStyle;
                        const label = TOOL_OPTIONS_SUMMARY_LABELS.fillStyle?.[fillStyle] ?? fillStyle;
                        return label ? `${label} shape` : "";
                }
                case "magnifier":
                        return `Zoom ${mergedSettings.zoom}×`;
                case "select":
                case "free-form-select": {
                        const mode = mergedSettings.selectionMode;
                        const label = TOOL_OPTIONS_SUMMARY_LABELS.selectionMode?.[mode] ?? mode;
                        return label ? `${label} selection` : "";
                }
                case "text": {
                        const background = mergedSettings.background;
                        const backgroundLabel = TOOL_OPTIONS_SUMMARY_LABELS.background?.[background] ?? background;
                        const family = mergedSettings.family ?? "";
                        const size = mergedSettings.size ?? "";
                        if (!family && !size) {
                                return backgroundLabel ? `${backgroundLabel} text` : "";
                        }
                        return [backgroundLabel ? `${backgroundLabel} text` : "Text", family, size ? `${size}pt` : ""].filter(Boolean).join(" ");
                }
                default:
                        return "";
        }
}

/**
 * @param {object} props
 * @param {Tool} props.tool
 * @param {Record<string, any>} [props.settings]
 * @param {(toolId: string, patch: Record<string, any>) => void} props.onChange
 * @returns {import("react").ReactElement}
 */
export function ToolOptions({ tool, settings, onChange }) {
        const defaults = TOOL_OPTIONS_DEFAULTS[tool.id] ?? {};
        const resolvedSettings = useMemo(() => ({
                ...defaults,
                ...(settings ?? {}),
        }), [defaults, settings]);

        const handleChange = (patch) => {
                onChange(tool.id, patch);
        };

        switch (tool.id) {
                case "pencil":
                case "line":
                case "curve":
                        return (
                                <StrokeSizeButtons
                                        items={STROKE_SIZE_ITEMS}
                                        selected={resolvedSettings.size}
                                        onSelect={(value) => handleChange({ size: value })}
                                        ariaLabel="Stroke size"
                                />
                        );
                case "brush":
                        return (
                                <Fragment>
                                        <StrokeSizeButtons
                                                items={BRUSH_SIZE_ITEMS}
                                                selected={resolvedSettings.size}
                                                onSelect={(value) => handleChange({ size: value })}
                                                ariaLabel="Brush size"
                                        />
                                        <OptionButtons
                                                items={BRUSH_SHAPE_ITEMS}
                                                selected={resolvedSettings.shape}
                                                onSelect={(value) => handleChange({ shape: value })}
                                                ariaLabel="Brush shape"
                                        />
                                </Fragment>
                        );
                case "airbrush":
                        return (
                                <StrokeSizeButtons
                                        items={AIRBRUSH_SIZE_ITEMS}
                                        selected={resolvedSettings.size}
                                        onSelect={(value) => handleChange({ size: value })}
                                        ariaLabel="Airbrush size"
                                />
                        );
                case "eraser":
                        return (
                                <StrokeSizeButtons
                                        items={ERASER_SIZE_ITEMS}
                                        selected={resolvedSettings.size}
                                        onSelect={(value) => handleChange({ size: value })}
                                        ariaLabel="Eraser size"
                                />
                        );
                case "rectangle":
                case "polygon":
                case "ellipse":
                case "rounded-rectangle":
                        return (
                                <OptionButtons
                                        items={FILL_STYLE_ITEMS}
                                        selected={resolvedSettings.fillStyle}
                                        onSelect={(value) => handleChange({ fillStyle: value })}
                                        ariaLabel="Fill style"
                                />
                        );
                case "magnifier":
                        return (
                                <OptionButtons
                                        items={MAGNIFIER_ZOOM_ITEMS.map((item) => ({
                                                ...item,
                                                render: () => (
                                                        <span className="tool-option-text" aria-hidden="true">{item.id}</span>
                                                ),
                                                width: 24,
                                        }))}
                                        selected={resolvedSettings.zoom}
                                        onSelect={(value) => handleChange({ zoom: typeof value === "number" ? value : Number(value) })}
                                        ariaLabel="Zoom level"
                                />
                        );
                case "select":
                case "free-form-select":
                        return (
                                <OptionButtons
                                        items={SELECTION_MODE_ITEMS.map((item) => ({
                                                ...item,
                                                width: 24,
                                        }))}
                                        selected={resolvedSettings.selectionMode}
                                        onSelect={(value) => handleChange({ selectionMode: value })}
                                        ariaLabel="Selection background mode"
                                />
                        );
                case "text":
                        return (
                                <OptionButtons
                                        items={TEXT_BACKGROUND_ITEMS.map((item) => ({
                                                ...item,
                                                width: 24,
                                        }))}
                                        selected={resolvedSettings.background}
                                        onSelect={(value) => handleChange({ background: value })}
                                        ariaLabel="Text background mode"
                                />
                        );
                default:
                        return (
                                <div className="tool-option-placeholder" aria-live="polite">
                                        <span aria-hidden="true">—</span>
                                        <span className="sr-only">No options available</span>
                                </div>
                        );
        }
}

export default ToolOptions;
