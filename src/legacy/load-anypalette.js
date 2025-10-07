const anyPaletteURL = new URL("../../lib/anypalette-0.6.0.js", import.meta.url).href;

const ensureAnyPalette = () => new Promise((resolve, reject) => {
	if (window.AnyPalette) {
		resolve(window.AnyPalette);
		return;
	}

	const script = document.createElement("script");
	script.src = anyPaletteURL;
	script.async = false;
	script.type = "text/javascript";
	script.onload = () => resolve(window.AnyPalette);
	script.onerror = () => reject(new Error(`Failed to load AnyPalette from ${anyPaletteURL}`));
	document.head.append(script);
});

await ensureAnyPalette();
