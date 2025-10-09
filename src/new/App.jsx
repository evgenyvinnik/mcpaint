import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
        Frame,
        ColorBox,
        ToolBox,
        FontBox,
        ToolOptions,
        createInitialToolSettings,
        describeToolOptions,
        TOOL_OPTIONS_DEFAULTS,
} from "../react/components/index.js";
import { default_palette as DEFAULT_PALETTE } from "../color-data.js";
import { DEFAULT_STATUS_TEXT } from "../react/components/Frame.jsx";

const BASE_TOOLBOX_ITEMS = [
        {
                id: "free-form-select",
                name: "Free-Form Select",
                description: "Selects a free-form part of the picture to move, copy, or edit.",
                iconIndex: 0,
        },
        {
                id: "select",
                name: "Select",
                description: "Selects a rectangular part of the picture to move, copy, or edit.",
                iconIndex: 1,
        },
        {
                id: "eraser",
                name: "Eraser",
                description: "Erases a portion of the picture, using the selected eraser shape.",
                iconIndex: 2,
        },
        {
                id: "fill",
                name: "Fill With Color",
                description: "Fills an area with the selected drawing color.",
                iconIndex: 3,
        },
        {
                id: "pick-color",
                name: "Pick Color",
                description: "Picks up a color from the picture for drawing.",
                iconIndex: 4,
        },
        {
                id: "magnifier",
                name: "Magnifier",
                description: "Changes the magnification.",
                iconIndex: 5,
        },
        {
                id: "pencil",
                name: "Pencil",
                description: "Draws a free-form line one pixel wide.",
                iconIndex: 6,
        },
        {
                id: "brush",
                name: "Brush",
                description: "Draws using a brush with the selected shape and size.",
                iconIndex: 7,
        },
        {
                id: "airbrush",
                name: "Airbrush",
                description: "Draws using an airbrush of the selected size.",
                iconIndex: 8,
        },
        {
                id: "text",
                name: "Text",
                description: "Inserts text into the picture.",
                iconIndex: 9,
        },
        {
                id: "line",
                name: "Line",
                description: "Draws a straight line with the selected line width.",
                iconIndex: 10,
        },
        {
                id: "curve",
                name: "Curve",
                description: "Draws a curved line with the selected line width.",
                iconIndex: 11,
        },
        {
                id: "rectangle",
                name: "Rectangle",
                description: "Draws a rectangle with the selected fill style.",
                iconIndex: 12,
        },
        {
                id: "polygon",
                name: "Polygon",
                description: "Draws a polygon with the selected fill style.",
                iconIndex: 13,
        },
        {
                id: "ellipse",
                name: "Ellipse",
                description: "Draws an ellipse with the selected fill style.",
                iconIndex: 14,
        },
        {
                id: "rounded-rectangle",
                name: "Rounded Rectangle",
                description: "Draws a rounded rectangle with the selected fill style.",
                iconIndex: 15,
        },
];

const DEFAULT_PRIMARY = DEFAULT_PALETTE[0];
const DEFAULT_SECONDARY = DEFAULT_PALETTE[DEFAULT_PALETTE.length - 1];
const DEFAULT_TOOL_SELECTION = [BASE_TOOLBOX_ITEMS[6]?.id ?? BASE_TOOLBOX_ITEMS[0]?.id ?? ""];
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 320;

const shallowEqual = (a = {}, b = {}) => {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const key of keys) {
                if (!Object.is(a[key], b[key])) {
                        return false;
                }
        }
        return true;
};

export function App() {
        const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
        const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
        const [selectedToolIds, setSelectedToolIds] = useState(DEFAULT_TOOL_SELECTION);
        const [hoveredTool, setHoveredTool] = useState(null);
        const [toolSettings, setToolSettings] = useState(createInitialToolSettings);
        const canvasRef = useRef(null);

        const handleToolSettingsChange = useCallback((toolId, patch) => {
                setToolSettings((previousState) => {
                        const defaults = TOOL_OPTIONS_DEFAULTS[toolId] ?? {};
                        const previousForTool = previousState[toolId] ?? {};
                        const nextForTool = {
                                ...defaults,
                                ...previousForTool,
                                ...patch,
                        };

                        if (shallowEqual(previousForTool, nextForTool)) {
                                return previousState;
                        }

                        return {
                                ...previousState,
                                [toolId]: nextForTool,
                        };
                });
        }, []);

        const toolboxItems = useMemo(
                () => BASE_TOOLBOX_ITEMS.map((tool) => ({
                        ...tool,
                        options: (currentTool) => (
                                <ToolOptions
                                        key={currentTool.id}
                                        tool={currentTool}
                                        settings={toolSettings[currentTool.id]}
                                        onChange={handleToolSettingsChange}
                                />
                        ),
                })),
                [toolSettings, handleToolSettingsChange],
        );

        const activeTool = useMemo(
                () => toolboxItems.find((tool) => selectedToolIds.includes(tool.id)) ?? toolboxItems[0] ?? null,
                [selectedToolIds, toolboxItems],
        );

        const activeToolSettings = useMemo(() => {
                if (!activeTool) {
                        return null;
                }
                const defaults = TOOL_OPTIONS_DEFAULTS[activeTool.id] ?? {};
                return {
                        ...defaults,
                        ...(toolSettings[activeTool.id] ?? {}),
                };
        }, [activeTool, toolSettings]);

        const statusDetails = useMemo(() => {
                if (hoveredTool || !activeTool) {
                        return "";
                }
                return describeToolOptions(activeTool.id, activeToolSettings ?? {});
        }, [hoveredTool, activeTool, activeToolSettings]);

        const statusMessage = useMemo(() => {
                if (hoveredTool) {
                        return hoveredTool.description ?? DEFAULT_STATUS_TEXT;
                }
                if (activeTool) {
                        const base = activeTool.description ?? DEFAULT_STATUS_TEXT;
                        if (!statusDetails) {
                                return base;
                        }
                        return `${base} ${statusDetails}`;
                }
                return DEFAULT_STATUS_TEXT;
        }, [hoveredTool, activeTool, statusDetails]);

        useEffect(() => {
                const canvas = canvasRef.current;
                if (!canvas) {
                        return;
                }
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                        return;
                }
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = "#7f7f7f";
                ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
        }, []);

        const fontSettings = useMemo(
                () => ({
                        ...TOOL_OPTIONS_DEFAULTS.text,
                        ...(toolSettings.text ?? {}),
                }),
                [toolSettings],
        );

        const handleFontFormattingChange = useCallback(
                (formatting) => {
                        handleToolSettingsChange("text", formatting);
                },
                [handleToolSettingsChange],
        );

        const showFontBox = activeTool?.id === "text";

        return (
                <Frame
                        leftContent={(
                                <ToolBox
                                        tools={toolboxItems}
                                        selectedToolIds={selectedToolIds}
                                        onSelectionChange={(toolIds) => setSelectedToolIds(toolIds)}
                                        onHoverChange={setHoveredTool}
                                />
                        )}
                        rightContent={showFontBox ? (
                                <FontBox
                                        defaultFamily={fontSettings.family}
                                        defaultSize={fontSettings.size}
                                        defaultFormatting={{
                                                bold: fontSettings.bold,
                                                italic: fontSettings.italic,
                                                underline: fontSettings.underline,
                                                vertical: fontSettings.vertical,
                                        }}
                                        onChange={handleFontFormattingChange}
                                />
                        ) : null}
                        bottomContent={(
                                <ColorBox
                                        palette={DEFAULT_PALETTE}
                                        initialPrimary={DEFAULT_PRIMARY}
                                        initialSecondary={DEFAULT_SECONDARY}
                                        onPrimaryChange={setPrimaryColor}
                                        onSecondaryChange={setSecondaryColor}
                                />
                        )}
                        canvasContent={(
                                <canvas
                                        ref={canvasRef}
                                        className="main-canvas"
                                        width={CANVAS_WIDTH}
                                        height={CANVAS_HEIGHT}
                                        aria-label="Drawing canvas preview"
                                />
                        )}
                        statusText={statusMessage}
                        statusPosition={`Primary ${primaryColor}`}
                        statusSize={`Secondary ${secondaryColor}`}
                />
        );
}

export default App;
