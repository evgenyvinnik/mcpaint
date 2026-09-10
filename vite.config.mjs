import { resolve } from "node:path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { viteStaticCopy } from "vite-plugin-static-copy";

const htmlEntries = {
	main: resolve(import.meta.dirname, "index.html"),
	about: resolve(import.meta.dirname, "about.html"),
	jspaintAlternative: resolve(import.meta.dirname, "jspaint-alternative.html"),
	privacy: resolve(import.meta.dirname, "privacy.html"),
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
		rolldownOptions: {
			input: htmlEntries,
		},
	},
	plugins: [
		react(),
		babel({ presets: [reactCompilerPreset()] }),
		viteStaticCopy({
			targets: staticAssets,
		}),
	],
});
