# Dependency review and upgrades

Reviewed and updated September 9, 2026. The root package manifest and lockfile now contain the package upgrades from this review, with the compatibility holds explained below. Vendored-library replacement and bundle refactors remain separate follow-up work.

## Packages updated

| Package | Before this upgrade batch | Installed |
| --- | --- | --- |
| Vite | 7.3.6 | 8.2.2 |
| React Vite plugin | 5.2.0 | 6.1.1 |
| Static copy plugin | 3.4.0 | 4.1.1 |
| Babel core | Transitive Babel 7 | 8.0.1, now explicit |
| Rolldown Babel plugin | Not installed | 0.2.4 |
| React / React DOM | 19.2.7 | 19.3.0, upgraded together |
| React / React DOM declarations | 19.2.17 / 19.2.3 | 19.3.0 / 19.3.0 |
| Zustand | 5.0.14 | 5.0.15 |
| i18next | 25.10.10 | 26.4.2 |
| react-i18next | 16.6.6 | 17.0.13 |
| i18next HTTP backend | 3.0.6 | 4.0.2 |
| Vercel Analytics | 1.6.1 | 2.0.1 |
| Playwright | 1.61.1 | 1.63.0, with its matching Chromium binaries |
| Prettier | 3.9.5 | 3.9.6 |
| CSpell CLI | 9.8.0 | 10.2.0 |
| glob | 11.1.0 | 13.0.6 |
| globals | 16.5.0 | 17.12.0 |
| Node declarations | 26.1.1 | 22.20.2, aligned with the runtime |
| Speech recognition declarations | 0.0.9 | 0.0.12 |
| YouTube declarations | 0.2.0 | 0.3.0 |

The preceding security-cleanup batch removed the unused `@1j01/live-server` dependency, applied compatible transitive security fixes, and upgraded ESLint to 10.10.0, `@eslint/js` to 10.0.1, and `typescript-eslint` to 8.70.0. Those changes are retained. No forced peer-dependency overrides were used.

`npm audit` reports **0 findings**, down from 18 before the cleanup. The final root audit counts 517 dependencies, down from 739 before cleanup; these are dependency-tree counts, not browser download counts.

## Build and runtime migration

- Migrated to Vite 8 and `build.rolldownOptions`. Renamed the configuration to `vite.config.mjs` and used `import.meta.dirname`, so it loads as native ESM while the legacy CommonJS scripts keep working. Updated the explicit test-server and ESLint configuration references.
- Preserved React Compiler through `reactCompilerPreset()` and `@rolldown/plugin-babel`, as documented for React plugin 6. Compiler output is checked in the production bundle. The existing Babel compiler remains at its current stable release, 1.0.0.
- Corrected malformed scrollbar selectors in the vendored OS GUI CSS, which Vite 8's Lightning CSS parser rejects. Recorded the corrections in `lib/os-gui.patch`; the existing window-focus patch is preserved, and reverse application of the complete patch validates successfully.
- Corrected the legacy MenuBar export bridge to prefer browser globals in a browser and CommonJS exports in Node. Rolldown's CommonJS wrapping exposed the previous mismatch only in production. This fix is also retained in the vendor patch.
- Standardized the repository on **Node 22.18 or newer within Node 22**. `package.json` records the engine range, `.nvmrc` selects Node 22, and the versioning workflow reads `.nvmrc`. The upgrades were installed and tested with Node 22.18.0. Babel 8 requires at least that version on Node 22.
- Upgraded localization as a coordinated set. No removed custom-formatting APIs or generated `Trans` keys were in use. The HTTP backend now uses native `fetch`, available in the supported runtime and target browsers.
- Fixed language detection so the English HTML template cannot override a regional browser preference such as German. Language changes now update the document's language, direction, and existing RTL stylesheets, including after a reload and in production.

The migration follows the [Vite guide](https://vite.dev/guide/migration), [React plugin Compiler integration](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#react-compiler), [static-copy changelog](https://github.com/sapphi-red/vite-plugin-static-copy/blob/main/CHANGELOG.md), [i18next migration guide](https://www.i18next.com/misc/migration-guide), and [HTTP backend changelog](https://github.com/i18next/i18next-http-backend/blob/master/CHANGELOG.md).

## Regression fixes and checks

The original review identified five failing undo tests. Investigation found that the mutable history tree did not trigger updates to the cached undo/redo availability flags. `useCanvasHistory` now subscribes to those booleans through Zustand, keeping keyboard shortcuts current under React Compiler. The old status-bar test expected an undo label that is not part of the UI; it now checks that Edit enables Undo after a drawing.

The new reload check also exposed an initialization race: a second development effect could fill the canvas white while an IndexedDB read was still pending, causing the restore to mistake initialization for user drawing. The lifecycle now marks the read complete only after it resolves on an active effect. It still never saves to IndexedDB during cleanup.

`tests/app-smoke.spec.ts` checks repeated canvas reloads, browser-language detection, saved language preferences, unsupported-language fallback, Arabic RTL layout, switching back to English, static pages, and copied assets. `playwright.production.config.ts` runs these checks against the built output and refuses to reuse a development server.

Run the production checks with:

```sh
npm run test:production -- tests/app-smoke.spec.ts tests/undo-redo.spec.ts tests/dialogs/attributes-dialog.spec.ts --workers=1
```

## Validation

- Clean installation from the upgraded lockfile: passed. The manifest and lockfile agree, and the installed dependency tree resolves without invalid peers.
- Production build: passed with all four HTML entry points and React Compiler enabled. The main JavaScript chunk is about 580 kB before gzip and 181 kB after gzip; the existing large-chunk warning remains.
- `npm run lint`: passed, including both TypeScript projects and CSpell, with 0 errors and 50 existing warnings. Formatting and whitespace checks cover the edited source files; patch files preserve their required context whitespace.
- All 974 visible copied asset files matched their source bytes, including localization resources, fonts, help, styles, and vendored libraries. All four HTML entries and React Compiler output were verified.
- `npm run test:production -- tests/app-smoke.spec.ts tests/undo-redo.spec.ts tests/dialogs/attributes-dialog.spec.ts --workers=1`: **25 passed**. This covers all nine app smoke checks, all seven undo/redo checks, and all nine canvas-attribute checks against the actual production bundle.
- The same 25 checks also passed in development. Five additional comparison cases failed in both the finished migration and the original dependency baseline, as detailed below.
- Inspected production screenshots in English and Arabic; the Paint layout, menus, tool icons, palette, and mirrored RTL controls render correctly.
- glob 13 returned exactly the same 1,950 resource-file paths as an independent filesystem traversal, validating the API used by the localization generator.
- A broader exploratory browser run found existing text, selection, and zoom failures. An isolated comparison using Vite 7.3.6, React 19.2.7, Playwright 1.61.1, its matching browser, the original history/lifecycle/localization hooks and vendor CSS, and a full local asset copy reproduced all five investigated cases: creating a text box, moving a selection, cutting a selection, cancelling a selection with Escape, and applying 100% zoom. These are not evidence of a fully passing browser suite; they remain follow-up issues outside the package update.

## Compatibility holds

`npm outdated` now lists only these two packages:

- **TypeScript 5.9.3:** retain it as planned. The current `typescript-eslint` declares `>=4.8.4 <6.1.0`, excluding the latest TypeScript 7.0.2. Revisit the compiler migration once the lint toolchain supports it.
- **jQuery declarations 3.5.34:** keep declarations for jQuery 3 while the vendored library is jQuery 3.4.1. Updating only the declarations to jQuery 4 would misrepresent the runtime APIs. Review or remove that legacy runtime separately.

## Remaining refactor opportunities

These were recommendations in the original review, not package-update prerequisites:

1. Audit indirect CSS and help-page references before narrowing the copied `lib/` assets. Keep the custom OS GUI patch when syncing the vendor package. Root npm audit does not cover vendored JavaScript or independently locked projects under Tracky Mouse.
2. Measure splitting help and less frequently used dialogs from the main bundle. The AI panel is enabled by default, so making it lazy alone would not necessarily reduce initial transferred JavaScript.
3. Keep deliberate existing memoization unless behavior is verified. [React's guidance](https://react.dev/learn/react-compiler/introduction) advises retaining existing memoization or testing removals carefully.
4. Review major upgrades periodically. Dependabot already runs weekly, but its configuration ignores major releases.
