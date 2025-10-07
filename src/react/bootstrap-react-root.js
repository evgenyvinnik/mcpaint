const REACT_CONTAINER_ID = "react-root";
const CONTAINER_PROPERTY = "__jspaintReactRoot";

const container = document.getElementById(REACT_CONTAINER_ID);

if (!container) {
	// eslint-disable-next-line no-console
	console.warn(`[react-bootstrap] Missing #${REACT_CONTAINER_ID}; React shell not mounted.`);
} else {
	const mountReactBridge = async () => {
		try {
			const [react, reactDOMClient, rootModule] = await Promise.all([
				import("react"),
				import("react-dom/client"),
				import("./Root.js"),
			]);

			const { StrictMode, createElement } = react;
			const { createRoot } = reactDOMClient;
			const createRootComponent = rootModule.default || rootModule.createRootComponent;

			if (!createRootComponent) {
				throw new Error("Missing React bridge factory export from ./Root.js");
			}

			const Root = createRootComponent(react);
			// Reuse the existing root to support Vite's HMR without remounting the entire legacy UI.
			const root = container[CONTAINER_PROPERTY] || createRoot(container);

			root.render(
				createElement(StrictMode, null, createElement(Root)),
			);

			container[CONTAINER_PROPERTY] = root;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn("[react-bootstrap] React shell not mounted; falling back to legacy DOM.", error);
		}
	};

	mountReactBridge();

	if (import.meta.hot) {
		import.meta.hot.accept();
		import.meta.hot.dispose(() => {
			container[CONTAINER_PROPERTY]?.unmount();
			delete container[CONTAINER_PROPERTY];
		});
	}
}
