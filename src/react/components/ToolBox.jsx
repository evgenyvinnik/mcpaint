import { useCallback, useEffect, useMemo, useState } from "react";
import { Component } from "./Component.jsx";

/** @typedef {import("react").ReactNode} ReactNode */

/**
 * @typedef {Object} Tool
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {ReactNode} [icon]
 * @property {string} [shortcut]
 * @property {ReactNode | ((tool: Tool) => ReactNode)} [options]
 */

const ensureTools = (tools = []) => tools.map((tool) => ({
        ...tool,
        id: tool.id ?? tool.name,
}));

const resolveOptionsContent = (tool) => {
        if (!tool) {
                return null;
        }
        if (typeof tool.options === "function") {
                return tool.options(tool);
        }
        return tool.options ?? null;
};

const arraysEqual = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * React counterpart for the legacy ToolBox component.
 * Supports multi-selection via modifier keys, hover descriptions, and tool options panes.
 *
 * @param {object} props
 * @param {Tool[]} props.tools
 * @param {string[]} [props.selectedToolIds]
 * @param {(toolIds: string[], tools: Tool[]) => void} [props.onSelectionChange]
 * @param {boolean} [props.isExtras]
 * @param {string} [props.title]
 * @returns {import("react").ReactElement}
 */
export function ToolBox({
        tools: toolsProp,
        selectedToolIds = [],
        onSelectionChange,
        isExtras = false,
        title,
}) {
        const tools = useMemo(() => ensureTools(toolsProp), [toolsProp]);
        const [selected, setSelected] = useState(() => (
                selectedToolIds.length ? selectedToolIds : (tools[0] ? [tools[0].id] : [])
        ));
        const [hoveredToolId, setHoveredToolId] = useState(null);

        const emitSelectionChange = useCallback((nextSelection) => {
                const resolvedTools = tools.filter((tool) => nextSelection.includes(tool.id));
                onSelectionChange?.(nextSelection, resolvedTools);
        }, [onSelectionChange, tools]);

        useEffect(() => {
                if (!selectedToolIds.length) {
                        return;
                }
                if (arraysEqual(selected, selectedToolIds)) {
                        return;
                }
                setSelected(selectedToolIds);
                emitSelectionChange(selectedToolIds);
        }, [selectedToolIds, emitSelectionChange, selected]);

        useEffect(() => {
                if (!tools.length) {
                        return;
                }
                if (!selected.length) {
                        const fallbackSelection = [tools[0].id];
                        setSelected(fallbackSelection);
                        emitSelectionChange(fallbackSelection);
                        return;
                }
                const unknownIds = selected.filter((id) => !tools.some((tool) => tool.id === id));
                if (unknownIds.length) {
                        setSelected((prev) => {
                                const next = prev.filter((id) => !unknownIds.includes(id));
                                if (!arraysEqual(prev, next)) {
                                        emitSelectionChange(next);
                                }
                                return next;
                        });
                }
        }, [tools, selected, emitSelectionChange]);

        const updateSelection = useCallback((tool, multi) => {
                setSelected((prev) => {
                        let next;
                        if (multi) {
                                if (prev.includes(tool.id)) {
                                        next = prev.filter((id) => id !== tool.id);
                                        if (!next.length) {
                                                next = [tool.id];
                                        }
                                } else {
                                        next = [...prev, tool.id];
                                }
                        } else if (prev.length === 1 && prev[0] === tool.id) {
                                next = prev;
                        } else {
                                next = [tool.id];
                        }
                        if (!arraysEqual(prev, next)) {
                                emitSelectionChange(next);
                        }
                        return arraysEqual(prev, next) ? prev : next;
                });
        }, [emitSelectionChange]);

        const activeTool = useMemo(() => tools.find((tool) => selected.includes(tool.id)) ?? null, [tools, selected]);
        const hoveredTool = useMemo(() => tools.find((tool) => tool.id === hoveredToolId) ?? null, [tools, hoveredToolId]);
        const description = hoveredTool?.description ?? activeTool?.description ?? "Select a tool to see details.";

        const componentTitle = title || (isExtras ? "Extra Tools" : "Tools");
        const className = ["tools-component", isExtras ? "extra-tools-component" : ""].filter(Boolean).join(" ");

        return (
                <Component title={componentTitle} className={className} orientation="tall">
                        <div className="tool-box" role="group" aria-label={componentTitle}>
                                <div className="tool-grid" role="listbox" aria-multiselectable={true}>
                                        {tools.map((tool) => {
                                                const isSelected = selected.includes(tool.id);
                                                return (
                                                        <button
                                                                key={tool.id}
                                                                type="button"
                                                                className={["tool", isSelected ? "selected" : ""].filter(Boolean).join(" ")}
                                                                aria-pressed={isSelected}
                                                                aria-label={tool.shortcut ? `${tool.name} (${tool.shortcut})` : tool.name}
                                                                onClick={(event) => updateSelection(tool, event.shiftKey || event.ctrlKey || event.metaKey)}
                                                                onMouseEnter={() => setHoveredToolId(tool.id)}
                                                                onMouseLeave={() => setHoveredToolId(null)}
                                                        >
                                                                <span className="tool-icon" aria-hidden="true">
                                                                        {tool.icon ?? tool.name.charAt(0)}
                                                                </span>
                                                                <span className="tool-label">{tool.name}</span>
                                                        </button>
                                                );
                                        })}
                                </div>
                                <div className="tool-options" aria-live="polite">
                                        {resolveOptionsContent(activeTool) ?? (
                                                <p className="tool-options-placeholder">Select a tool to configure its options.</p>
                                        )}
                                </div>
                                <div className="tool-description" aria-live="polite">
                                        {description}
                                </div>
                        </div>
                </Component>
        );
}

export default ToolBox;
