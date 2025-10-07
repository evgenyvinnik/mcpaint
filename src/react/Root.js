export function createRootComponent({ useEffect }) {
	const Root = () => {
		useEffect(() => {
			const bridgeState = {
				version: "0.1.0",
				readyAt: performance.now(),
			};

			window.__jspaintReactBridge = bridgeState;
			window.jspaint = window.jspaint || {};
			window.jspaint.reactBridge = bridgeState;

			return () => {
				if (window.jspaint) {
					delete window.jspaint.reactBridge;
				}
				delete window.__jspaintReactBridge;
			};
		}, []);

		return null;
	};

	return Root;
}

export default createRootComponent;
