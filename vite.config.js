import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

const htmlEntries = {
	main: resolve(__dirname, "index.html"),
	about: resolve(__dirname, "about.html"),
	privacy: resolve(__dirname, "privacy.html"),
};

const staticAssets = [
	{ src: "audio", dest: "." },
	{ src: "help", dest: "." },
	{ src: "images", dest: "." },
	{ src: "lib", dest: "." }, // Copy lib directory to dist root, so lib/* goes to dist/lib/*
	{ src: "styles", dest: "." },
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
		// Vite 8 defaults CSS minification to Lightning CSS, which rejects
		// valid-in-browsers vendor selectors like
		// `::-webkit-scrollbar-button:not(.disabled):hover:active` used by the
		// vendored os-gui/98.css. Keep the more lenient esbuild minifier.
		cssMinify: "esbuild",
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
