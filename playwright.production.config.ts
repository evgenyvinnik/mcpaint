import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig({
  ...config,
  webServer: {
    command: "npm run preview -- --port=11822 --strictPort",
    url: "http://localhost:11822/",
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
