import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	root: ".",
	plugins: [
		react(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	server: {
		port: 1999,
		strictPort: true,
	},
	preview: {
		port: 4173,
		strictPort: true,
	},
	build: {
		rollupOptions: {
			input: path.resolve(__dirname, "index.html"),
		},
	},
});
