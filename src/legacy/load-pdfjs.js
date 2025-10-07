const pdfjsURL = new URL("../../lib/pdf.js/build/pdf.js", import.meta.url).href;
const pdfjsWorkerURL = new URL("../../lib/pdf.js/build/pdf.worker.js", import.meta.url).href;

const applyWorkerSource = (pdfjs) => {
	if (!pdfjs?.GlobalWorkerOptions) {
		return;
	}
	pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerURL;
};

const ensureGlobalPdfjs = async () => {
	if (window.pdfjsLib || window["pdfjs-dist/build/pdf"]) {
		const pdfjs = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
		window.pdfjsLib = pdfjs;
		window["pdfjs-dist/build/pdf"] = pdfjs;
		applyWorkerSource(pdfjs);
		return;
	}

	await new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = pdfjsURL;
		script.async = false;
		script.type = "text/javascript";
		script.onload = resolve;
		script.onerror = () => reject(new Error(`Failed to load legacy PDF.js script from ${pdfjsURL}`));
		document.head.append(script);
	});

	const pdfjs = window.pdfjsLib || window["pdfjs-dist/build/pdf"];

	if (!pdfjs) {
		throw new Error("Legacy PDF.js script loaded but window.pdfjsLib is missing.");
	}

	window.pdfjsLib = pdfjs;
	window["pdfjs-dist/build/pdf"] = pdfjs;
	applyWorkerSource(pdfjs);
};

await ensureGlobalPdfjs();
