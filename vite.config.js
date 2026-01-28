import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

const htmlEntries = {
	main: resolve(__dirname, "index.html"),
	// legacy: resolve(__dirname, "old/index.html"), // Exclude from Vite processing
	reactPreview: resolve(__dirname, "new/index.html"),
	about: resolve(__dirname, "about.html"),
	privacy: resolve(__dirname, "privacy.html"),
	testNewsNewer: resolve(__dirname, "test-news-newer.html"),
};

const staticAssets = [
	{ src: "audio", dest: "." },
	{ src: "help", dest: "." },
	{ src: "images", dest: "." },
	{ src: "lib", dest: "." }, // Copy lib directory to dist root, so lib/* goes to dist/lib/*
	{ src: "styles", dest: "." },
	{ src: "svg-paint", dest: "." },
	// Copy legacy JS files from src, excluding React app directories (new/, react/)
	// which must be processed by Vite for JSX transformation
	{ src: "src/*.js", dest: "src" },
	{ src: "src/*.css", dest: "src" },
	{ src: "old", dest: "." }, // Copy entire old directory as-is
	{ src: "browserconfig.xml", dest: "" },
	{ src: "favicon.ico", dest: "" },
	{ src: "manifest.webmanifest", dest: "" },
	{ src: "robots.txt", dest: "" },
	{ src: "sitemap.xml", dest: "" },
	{ src: "CNAME", dest: "" },
];

export default defineConfig({
	root: ".",
	publicDir: "public",
	appType: "mpa",
	server: {
		host: "0.0.0.0",
		port: 1999,
	},
	preview: {
		host: "0.0.0.0",
		port: 4173,
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: htmlEntries,
		},
	},
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler", {}]],
			},
		}),
		viteStaticCopy({
			targets: staticAssets,
		}),
	],
});
