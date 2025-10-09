import { useMemo, useState } from "react";
import { ColorBox } from "../react/components/ColorBox.jsx";
import { default_palette } from "../color-data.js";

const DEFAULT_PRIMARY = default_palette[0];
const DEFAULT_SECONDARY = default_palette[default_palette.length - 1];

const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
});

export function App() {
        const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
        const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
        const [editRequests, setEditRequests] = useState([]);

        const paletteForPreview = useMemo(() => default_palette.slice(0, 28), []);

        const handlePrimaryChange = (color) => {
                setPrimaryColor(color);
        };

        const handleSecondaryChange = (color) => {
                setSecondaryColor(color);
        };

        const handleEditRequest = (primary, secondary) => {
                setEditRequests((previous) => [
                        { primary, secondary, timestamp: Date.now() },
                        ...previous.slice(0, 9),
                ]);
        };

        return (
                <div className="react-preview__app-shell">
                        <header className="react-preview__header">
                                <h1>JS Paint React Preview</h1>
                                <p>Start porting panels to React while keeping the original jQuery app intact.</p>
                        </header>

                        <div className="react-preview__workspace">
                                <section className="react-preview__panel" aria-labelledby="react-preview-color-panel">
                                        <h2 id="react-preview-color-panel">Palette prototype</h2>
                                        <ColorBox
                                                palette={paletteForPreview}
                                                initialPrimary={DEFAULT_PRIMARY}
                                                initialSecondary={DEFAULT_SECONDARY}
                                                onPrimaryChange={handlePrimaryChange}
                                                onSecondaryChange={handleSecondaryChange}
                                                onEditRequest={handleEditRequest}
                                        />
                                </section>

                                <section className="react-preview__panel" aria-labelledby="react-preview-state-panel">
                                        <h2 id="react-preview-state-panel">Current selection</h2>
                                        <p className="react-preview__color-chip" aria-live="polite">
                                                <span className="react-preview__color-sample" style={{ background: primaryColor }} />
                                                Primary: {primaryColor}
                                        </p>
                                        <p className="react-preview__color-chip" aria-live="polite">
                                                <span className="react-preview__color-sample" style={{ background: secondaryColor }} />
                                                Secondary: {secondaryColor}
                                        </p>
                                        <h3>Recent edit color requests</h3>
                                        <ul className="react-preview__log">
                                                {editRequests.length === 0 ? (
                                                        <li className="react-preview__log-item">No edit requests yet. Try the Edit Colors button!</li>
                                                ) : (
                                                        editRequests.map((entry, index) => (
                                                                <li key={entry.timestamp + index} className="react-preview__log-item">
                                                                        <strong>
                                                                                {entry.primary} ↔ {entry.secondary}
                                                                        </strong>
                                                                        <time dateTime={new Date(entry.timestamp).toISOString()}>
                                                                                {formatTimestamp(entry.timestamp)}
                                                                        </time>
                                                                </li>
                                                        ))
                                                )}
                                        </ul>
                                </section>
                        </div>

                        <div className="react-preview__cta-row">
                                <a className="react-preview__cta" href="/old/">Open legacy app</a>
                                <a className="react-preview__cta secondary" href="/">Return to classic homepage</a>
                        </div>

                        <p className="react-preview__footer">
                                This preview reuses the existing palette logic via <code>src/react/components/ColorBox.jsx</code> so
                                new panels can be migrated incrementally.
                        </p>
                </div>
        );
}
