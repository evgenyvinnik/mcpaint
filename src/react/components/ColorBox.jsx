import { useCallback, useMemo, useState } from "react";
import { default_palette } from "../../color-data.js";
import { Component } from "./Component.jsx";

const FALLBACK_PRIMARY = "rgb(0,0,0)";
const FALLBACK_SECONDARY = "rgb(255,255,255)";

const ensurePalette = (palette) => {
        if (!Array.isArray(palette) || palette.length === 0) {
                return [FALLBACK_PRIMARY, FALLBACK_SECONDARY];
        }
        return palette;
};

const normalizeColor = (color, fallback) => (typeof color === "string" && color ? color : fallback);

const nextPaletteId = (color, index) => `${index}-${color}`;

/**
 * React counterpart to the legacy Colors component.
 * Provides palette interaction and primary/secondary swatch handling.
 *
 * @param {object} props
 * @param {string[]} [props.palette]
 * @param {string} [props.initialPrimary]
 * @param {string} [props.initialSecondary]
 * @param {(color: string) => void} [props.onPrimaryChange]
 * @param {(color: string) => void} [props.onSecondaryChange]
 * @param {(primary: string, secondary: string) => void} [props.onEditRequest]
 * @returns {import("react").ReactElement}
 */
export function ColorBox({
        palette: paletteProp,
        initialPrimary,
        initialSecondary,
        onPrimaryChange,
        onSecondaryChange,
        onEditRequest,
}) {
        const palette = useMemo(() => ensurePalette(paletteProp ?? default_palette), [paletteProp]);
        const [primary, setPrimary] = useState(() => normalizeColor(initialPrimary, palette[0] ?? FALLBACK_PRIMARY));
        const [secondary, setSecondary] = useState(() => normalizeColor(initialSecondary, palette[palette.length - 1] ?? FALLBACK_SECONDARY));
        const [hoveredSwatchId, setHoveredSwatchId] = useState(null);

        const selectPrimary = useCallback((color) => {
                setPrimary(color);
                onPrimaryChange?.(color);
        }, [onPrimaryChange]);

        const selectSecondary = useCallback((color) => {
                setSecondary(color);
                onSecondaryChange?.(color);
        }, [onSecondaryChange]);

        const handleSwatchInteraction = useCallback((event, color) => {
                if (event.type === "contextmenu" || event.button === 2 || event.ctrlKey) {
                        event.preventDefault();
                        selectSecondary(color);
                        return;
                }

                if (event.shiftKey) {
                        selectSecondary(color);
                        return;
                }

                selectPrimary(color);
        }, [selectPrimary, selectSecondary]);

        const editColors = useCallback(() => {
                onEditRequest?.(primary, secondary);
        }, [onEditRequest, primary, secondary]);

        const paletteRows = useMemo(() => {
                const midpoint = Math.ceil(palette.length / 2);
                return [
                        palette.slice(0, midpoint).map((color, index) => ({ color, index })),
                        palette.slice(midpoint).map((color, index) => ({ color, index: index + midpoint })),
                ];
        }, [palette]);

        return (
                <Component title="Colors" className="colors-component" orientation="wide">
                        <div className="color-box" role="group" aria-label="Color palette">
                                <div className="color-preview" aria-live="polite">
                                        <button
                                                type="button"
                                                className="color-preview-primary"
                                                style={{ background: primary }}
                                                aria-label={`Primary color: ${primary}`}
                                                onClick={() => selectPrimary(primary)}
                                        />
                                        <button
                                                type="button"
                                                className="color-preview-secondary"
                                                style={{ background: secondary }}
                                                aria-label={`Secondary color: ${secondary}`}
                                                onClick={() => selectSecondary(secondary)}
                                        />
                                </div>
                                <div className="palette" role="listbox" aria-orientation="horizontal">
                                        {paletteRows.map((row, rowIndex) => (
                                                <div key={`row-${rowIndex}`} className="palette-row">
                                                        {row.map(({ color, index }) => {
                                                                const swatchId = nextPaletteId(color, index);
                                                                const isPrimary = color === primary;
                                                                const isSecondary = color === secondary;
                                                                const isHovered = hoveredSwatchId === swatchId;
                                                                return (
                                                                        <button
                                                                                key={swatchId}
                                                                                type="button"
                                                                                className={[
                                                                                        "palette-swatch",
                                                                                        isPrimary ? "selected-primary" : "",
                                                                                        isSecondary ? "selected-secondary" : "",
                                                                                        isHovered ? "hovered" : "",
                                                                                ].filter(Boolean).join(" ")}
                                                                                style={{ background: color }}
                                                                                aria-label={`Select color ${color}`}
                                                                                aria-pressed={isPrimary || isSecondary}
                                                                                onClick={(event) => handleSwatchInteraction(event, color)}
                                                                                onContextMenu={(event) => handleSwatchInteraction(event, color)}
                                                                                onMouseEnter={() => setHoveredSwatchId(swatchId)}
                                                                                onMouseLeave={() => setHoveredSwatchId(null)}
                                                                        />
                                                                );
                                                        })}
                                                </div>
                                        ))}
                                </div>
                                <div className="color-actions">
                                        <button type="button" onClick={editColors}>
                                                Edit Colors…
                                        </button>
                                </div>
                        </div>
                </Component>
        );
}

export default ColorBox;
