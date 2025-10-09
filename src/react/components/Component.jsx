import React, { useMemo } from "react";

/**
 * Minimal recreation of the legacy $Component helper for docked panels.
 * Mirrors the original DOM structure so existing CSS themes continue to apply.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.className]
 * @param {"tall"|"wide"} [props.orientation]
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement}
 */
export function Component({
        title,
        className = "",
        orientation = "tall",
        children,
}) {
        const resolvedClassName = useMemo(
                () => ["component", className, orientation].filter(Boolean).join(" "),
                [className, orientation],
        );

        const style = useMemo(() => {
                const baseStyle = { touchAction: "none" };
                if (className.includes("colors-component") && orientation === "wide") {
                        baseStyle.position = "relative";
                        const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";
                        if (isRTL) {
                                baseStyle.marginRight = 3;
                        } else {
                                baseStyle.marginLeft = 3;
                        }
                }
                return baseStyle;
        }, [className, orientation]);

        return (
                <div className={resolvedClassName} data-component-title={title} style={style}>
                        {children}
                </div>
        );
}

export default Component;
