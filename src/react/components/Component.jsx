import { useEffect, useMemo, useRef, useState } from "react";

/** @typedef {import("react").ReactNode} ReactNode */

const ORIENTATION_CLASS = {
        tall: "vertical",
        wide: "horizontal",
};

const directionMarginProperty = (direction) => (direction === "rtl" ? "marginRight" : "marginLeft");

/**
 * A React-friendly recreation of the legacy $Component helper.
 * It provides an undockable panel wrapper with automatic scaling support.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.className]
 * @param {"tall"|"wide"} [props.orientation]
 * @param {"ltr"|"rtl"} [props.direction]
 * @param {boolean} [props.docked]
 * @param {boolean} [props.allowUndock]
 * @param {(docked: boolean) => void} [props.onDockChange]
 * @param {ReactNode | ((context: { docked: boolean }) => ReactNode)} props.children
 * @returns {import("react").ReactElement}
 */
export function Component({
        title,
        className = "",
        orientation = "tall",
        direction = "ltr",
        docked: dockedProp = true,
        allowUndock = false,
        onDockChange,
        children,
}) {
        const resolvedClassName = typeof className === "string" ? className : String(className ?? "");
        const containerRef = useRef(null);
        const [docked, setDocked] = useState(dockedProp);
        const [scaleStyle, setScaleStyle] = useState(() => ({ touchAction: "none" }));

        useEffect(() => {
                setDocked(dockedProp);
        }, [dockedProp]);

        useEffect(() => {
                const container = containerRef.current;
                if (!container) {
                        return () => {};
                }

                const applyScale = () => {
                        const body = document.body;
                        if (!body || !body.classList.contains("enlarge-ui")) {
                                setScaleStyle({ touchAction: "none" });
                                return;
                        }

                        container.style.transform = "none";
                        const { width, height } = container.getBoundingClientRect();
                        let scale = 3;

                        if (docked && container.parentElement) {
                                const parentBounds = container.parentElement.getBoundingClientRect();
                                scale = Math.min(
                                        scale,
                                        orientation === "tall"
                                                ? parentBounds.height / height || scale
                                                : parentBounds.width / width || scale,
                                );
                        }

                        setScaleStyle({
                                touchAction: "none",
                                transform: `scale(${scale})`,
                                transformOrigin: "0 0",
                                marginRight: width * (scale - 1),
                                marginBottom: height * (scale - 1),
                        });
                };

                applyScale();

                const resizeObserver = typeof ResizeObserver !== "undefined"
                        ? new ResizeObserver(applyScale)
                        : null;
                resizeObserver?.observe(container);

                const bodyObserver = typeof MutationObserver !== "undefined"
                        ? new MutationObserver(applyScale)
                        : null;
                if (bodyObserver) {
                        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
                }

                window.addEventListener("resize", applyScale);

                return () => {
                        resizeObserver?.disconnect();
                        bodyObserver?.disconnect();
                        window.removeEventListener("resize", applyScale);
                };
        }, [orientation, docked]);

        const toggleDock = () => {
                const nextDocked = !docked;
                setDocked(nextDocked);
                onDockChange?.(nextDocked);
        };

        const combinedStyle = useMemo(() => {
                const style = { ...scaleStyle };

                if (resolvedClassName.includes("colors-component") && orientation === "wide") {
                        style.position = "relative";
                        const marginProperty = directionMarginProperty(direction);
                        style[marginProperty] = (style[marginProperty] || 0) + 3;
                }

                return style;
        }, [scaleStyle, resolvedClassName, orientation, direction]);

        const resolvedChildren = typeof children === "function" ? children({ docked }) : children;
        const orientationClass = ORIENTATION_CLASS[orientation] || ORIENTATION_CLASS.tall;

        return (
                <section
                        ref={containerRef}
                        className={["react-component", "component", resolvedClassName, orientation, docked ? "docked" : "undocked"].filter(Boolean).join(" ")}
                        style={combinedStyle}
                        data-component-title={title}
                        dir={direction}
                >
                        <header className="component-header">
                                <span className="component-title" aria-hidden={false}>{title}</span>
                                {allowUndock && (
                                        <button
                                                type="button"
                                                className="component-undock"
                                                onClick={toggleDock}
                                                aria-pressed={!docked}
                                        >
                                                {docked ? "Pop out" : "Dock"}
                                        </button>
                                )}
                        </header>
                        <div className={["component-body", orientationClass].join(" ")}>
                                {resolvedChildren}
                        </div>
                </section>
        );
}

export default Component;
