const fileSaverURL = new URL("../../lib/FileSaver.js", import.meta.url).href;

const ensureFileSaver = () => new Promise((resolve, reject) => {
	if (window.saveAs) {
		resolve(window.saveAs);
		return;
	}

	const script = document.createElement("script");
	script.src = fileSaverURL;
	script.async = false;
	script.type = "text/javascript";
	script.onload = () => {
		if (!window.saveAs && window.FileSaver && typeof window.FileSaver.saveAs === "function") {
			window.saveAs = window.FileSaver.saveAs.bind(window.FileSaver);
		}
		resolve(window.saveAs);
	};
	script.onerror = () => reject(new Error(`Failed to load FileSaver.js from ${fileSaverURL}`));
	document.head.append(script);
});

await ensureFileSaver();
