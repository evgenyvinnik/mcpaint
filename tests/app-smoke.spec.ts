// cspell:ignore Datei Fichier
import { expect, test } from "@playwright/test";
import { drawOnCanvas, getCanvasDataUrl, selectToolByIndex, waitForAppLoaded } from "./utils/test-helpers";

test("drawing survives repeated reloads", async ({ page }) => {
  await page.goto("/");
  await waitForAppLoaded(page);
  await selectToolByIndex(page, 6);
  const blank = await getCanvasDataUrl(page);
  await drawOnCanvas(page, { start: { x: 0.2, y: 0.2 }, end: { x: 0.6, y: 0.6 } });
  const drawing = await getCanvasDataUrl(page);
  expect(drawing).not.toBe(blank);

  for (let reload = 0; reload < 2; reload++) {
    await page.reload();
    await waitForAppLoaded(page);
    await expect.poll(() => getCanvasDataUrl(page)).toBe(drawing);
  }
});

for (const language of [
  { locale: "de-DE", saved: "", expected: "Datei", code: "de" },
  { locale: "de-DE", saved: "fr", expected: "Fichier", code: "fr" },
  { locale: "eo", saved: "", expected: "File", code: "en" },
]) {
  test(`language detection: ${language.locale}, saved ${language.saved || "none"}`, async ({ browser }) => {
    const context = await browser.newContext({ locale: language.locale });
    try {
      if (language.saved) {
        await context.addInitScript((saved) => localStorage.setItem("mcpaint-language", saved), language.saved);
      }
      const page = await context.newPage();
      await page.goto("/");
      await waitForAppLoaded(page);
      await expect(page.getByRole("menuitem", { name: language.expected, exact: true })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", language.code);
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    } finally {
      await context.close();
    }
  });
}

test("Arabic layout and language switching persist across reloads", async ({ browser }) => {
  const context = await browser.newContext({ locale: "ar" });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await waitForAppLoaded(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("button", { name: "قلم", exact: true })).toBeVisible();
    await expect(page.locator(".jspaint")).toHaveCSS("direction", "rtl");
    await expect(page.locator("link[data-rtl-layout]")).toHaveCount(3);

    await page.locator(".menu-button").last().click();
    await page.locator(".menu-popup:visible .has-submenu").hover();
    await page.getByRole("menuitem", { name: /English/ }).click();
    await expect(page.getByRole("menuitem", { name: "File", exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator(".jspaint")).toHaveCSS("direction", "ltr");
    await expect(page.locator("link[data-rtl-layout]")).toHaveCount(0);

    await page.reload();
    await waitForAppLoaded(page);
    await expect(page.getByRole("menuitem", { name: "File", exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  } finally {
    await context.close();
  }
});

for (const path of ["/about", "/jspaint-alternative", "/privacy"]) {
  test(`static page ${path} loads with styles`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.title()).not.toBe("");
    expect(await page.locator('link[rel="stylesheet"]').count()).toBeGreaterThan(0);
    const missingStyles = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
        .filter((link) => !link.sheet)
        .map((link) => link.href),
    );
    expect(missingStyles).toEqual([]);
  });
}

test("copied assets and translation resources are served at their original paths", async ({ request }) => {
  for (const path of [
    "/lib/font-detective.js",
    "/lib/os-gui/MenuBar.js",
    "/lib/os-gui/build/windows-98.css",
    "/lib/os-gui/build/layout.rtl.css",
    "/lib/98.css/98.custom-build.rtl.css",
    "/styles/layout.rtl.css",
    "/locales/en/translation.json",
    "/locales/ar/translation.json",
    "/help/default.html",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect((await response.body()).length, path).toBeGreaterThan(0);
  }
});
