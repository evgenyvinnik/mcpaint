import React, { useEffect, useMemo, useRef } from "react";
import "../../../lib/os-gui/MenuBar.js";

const { MenuBar, MENU_DIVIDER } = /** @type {typeof globalThis & { MenuBar: (menu: Record<string, any[]>) => any; MENU_DIVIDER: any }} */ (globalThis);

const MENU_BAR_STORE_KEY = "__jspaintReactPreviewMenuBars";

const DEFAULT_MENU = {
        "&File": [
                {
                        label: "&New",
                        shortcutLabel: "Ctrl+N",
                        ariaKeyShortcuts: "Control+N",
                        description: "Start a fresh drawing.",
                        action: () => console.info("[preview] File > New"),
                },
                {
                        label: "&Open…",
                        shortcutLabel: "Ctrl+O",
                        ariaKeyShortcuts: "Control+O",
                        description: "Pick an existing image to open.",
                        action: () => console.info("[preview] File > Open"),
                },
                MENU_DIVIDER,
                {
                        label: "Recen&t Files",
                        description: "Quickly reopen recent work.",
                        submenu: [
                                { label: "landscape.png", action: () => console.info("[preview] Open recent: landscape.png") },
                                { label: "sprite-sheet.bmp", action: () => console.info("[preview] Open recent: sprite-sheet.bmp") },
                                MENU_DIVIDER,
                                { label: "Clea&r List", action: () => console.info("[preview] Clear recent files") },
                        ],
                },
                MENU_DIVIDER,
                {
                        label: "E&xit",
                        description: "Close the preview window.",
                        disabled: true,
                        action: () => {},
                },
        ],
        "&Edit": [
                {
                        label: "&Undo",
                        shortcutLabel: "Ctrl+Z",
                        ariaKeyShortcuts: "Control+Z",
                        disabled: true,
                        description: "Undo is disabled in this preview.",
                        action: () => {},
                },
                {
                        label: "&Redo",
                        shortcutLabel: "Ctrl+Y",
                        ariaKeyShortcuts: "Control+Y",
                        disabled: true,
                        description: "Redo is disabled in this preview.",
                        action: () => {},
                },
                MENU_DIVIDER,
                {
                        label: "Pr&eferences…",
                        description: "Open prototype settings.",
                        action: () => console.info("[preview] Edit > Preferences"),
                },
        ],
        "&View": [
                {
                        label: "Zoom",
                        submenu: [
                                { label: "100%", action: () => console.info("[preview] View > Zoom 100%") },
                                { label: "200%", action: () => console.info("[preview] View > Zoom 200%") },
                                { label: "400%", action: () => console.info("[preview] View > Zoom 400%") },
                        ],
                },
                {
                        label: "Show &Grid",
                        description: "Toggle the canvas grid overlay.",
                        action: () => console.info("[preview] View > Show Grid"),
                },
                {
                        label: "&Fullscreen",
                        shortcutLabel: "F11",
                        ariaKeyShortcuts: "F11",
                        description: "Try the app without browser chrome.",
                        action: () => console.info("[preview] View > Fullscreen"),
                },
        ],
        "&Help": [
                {
                        label: "View &Help",
                        description: "Open documentation for the classic app.",
                        action: () => console.info("[preview] Help > View Help"),
                },
                MENU_DIVIDER,
                {
                        label: "&About React Preview",
                        description: "Learn about the in-progress React UI.",
                        action: () => console.info("[preview] Help > About"),
                },
        ],
};

export const DEFAULT_STATUS_TEXT = "For Help, click Help Topics on the Help Menu.";

const DEFAULT_CANVAS_PLACEHOLDER = (
        <canvas className="main-canvas" width={480} height={320} aria-hidden="true" />
);

const getMenuBarStore = () => {
        if (typeof window === "undefined") {
                return null;
        }
        const globalWindow = /** @type {Window & { [MENU_BAR_STORE_KEY]?: Map<object, ReturnType<MenuBar>> }} */ (window);
        if (!globalWindow[MENU_BAR_STORE_KEY]) {
                globalWindow[MENU_BAR_STORE_KEY] = new Map();
        }
        return globalWindow[MENU_BAR_STORE_KEY];
};

/**
 * React wrapper for the legacy menu/frame layout.
 *
 * @param {object} props
 * @param {Record<string, any[]>} [props.menu]
 * @param {import("react").ReactNode} [props.topContent]
 * @param {import("react").ReactNode} [props.leftContent]
 * @param {import("react").ReactNode} [props.rightContent]
 * @param {import("react").ReactNode} [props.bottomContent]
 * @param {import("react").ReactNode} [props.canvasContent]
 * @param {string} [props.statusText]
 * @param {string} [props.statusPosition]
 * @param {string} [props.statusSize]
 * @param {string} [props.className]
 * @param {import("react").CSSProperties} [props.style]
 * @returns {import("react").ReactElement}
 */
export function Frame({
        menu = DEFAULT_MENU,
        topContent = null,
        leftContent = null,
        rightContent = null,
        bottomContent = null,
        canvasContent = DEFAULT_CANVAS_PLACEHOLDER,
        statusText = DEFAULT_STATUS_TEXT,
        statusPosition = "",
        statusSize = "",
        className = "",
        style,
}) {
        const verticalRef = useRef(null);

        useEffect(() => {
                const store = getMenuBarStore();
                const vertical = verticalRef.current;
                if (!store || !vertical) {
                        return () => {};
                }

                let menuBar = store.get(menu) || null;
                if (!menuBar) {
                        menuBar = MenuBar(menu);
                        store.set(menu, menuBar);
                }

                const { element } = menuBar;
                if (element.parentElement !== vertical) {
                        vertical.insertBefore(element, vertical.firstChild);
                }
                menuBar.setKeyboardScope(vertical);
                menuBar.closeMenus();

                return () => {
                        menuBar.closeMenus();
                        if (element.parentElement === vertical) {
                                vertical.removeChild(element);
                        }
                };
        }, [menu]);

        const resolvedClassName = useMemo(
                () => ["jspaint", className].filter(Boolean).join(" "),
                [className],
        );

        const resolvedCanvas = canvasContent ?? DEFAULT_CANVAS_PLACEHOLDER;
        const resolvedTop = topContent ? <div className="component-area top">{topContent}</div> : <div className="component-area top" aria-hidden="true" />;
        const resolvedLeft = leftContent ? <div className="component-area left">{leftContent}</div> : <div className="component-area left" aria-hidden="true" />;
        const resolvedRight = rightContent ? <div className="component-area right">{rightContent}</div> : <div className="component-area right" aria-hidden="true" />;
        const resolvedBottom = bottomContent ? <div className="component-area bottom">{bottomContent}</div> : <div className="component-area bottom" aria-hidden="true" />;

        return (
                <div className={resolvedClassName} style={style} role="application">
                        <div className="vertical" ref={verticalRef}>
                                {resolvedTop}
                                <div className="horizontal">
                                        {resolvedLeft}
                                        <div className="canvas-area inset-deep">{resolvedCanvas}</div>
                                        {resolvedRight}
                                </div>
                                {resolvedBottom}
                                <div className="status-area">
                                        <div className="status-text status-field inset-shallow" aria-live="polite">{statusText}</div>
                                        <div className="status-coordinates status-field inset-shallow">{statusPosition}</div>
                                        <div className="status-coordinates status-field inset-shallow">{statusSize}</div>
                                </div>
                        </div>
                </div>
        );
}

export default Frame;
