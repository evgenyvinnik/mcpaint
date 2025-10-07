# Migration Roadmap

## Current architecture snapshot
- `index.html` bootstraps the entire experience with more than twenty `<script type="module">` tags that directly load individual modules such as `src/app.js`, `src/helpers.js`, `src/$ToolBox.js`, and others, relying on the browser to resolve module ordering and exposing globals on `window` for cross-module communication.【F:index.html†L1432-L1471】【F:src/app.js†L1-L63】
- `src/app.js` orchestrates most runtime behavior: it imports UI widgets (for example `$ColorBox`, `$ToolBox`, `Handles`) and exports functions to the global scope to keep legacy consumers working, revealing the project’s reliance on implicit globals and tight coupling between modules.【F:src/app.js†L1-L67】【F:src/app.js†L80-L110】
- Layout and UI utilities lean heavily on jQuery-style helpers (for example `$Component`, `$ToolWindow`, `$G`), custom DOM manipulation, and CSS produced outside of a bundler, which will influence how we transition to component-based tooling.【F:src/'$Component.js'†L1-L120】【F:styles/layout.css†L1-L40】
- Tooling today centers on `@1j01/live-server` for local development and manual CSS builds via `rtlcss`, with no modern build pipeline for JavaScript bundling or asset hashing. This context informs the work needed before Vite can take over build and dev-server responsibilities.【F:package.json†L87-L140】

## Phase 1 – Adopt Vite as the build and dev platform

### 1. Preparation and inventory
1. Catalogue entry points and side-effect modules. Confirm which modules must execute in order (for example, `helpers.js` before `app.js`) and identify any scripts that still depend on being loaded globally (e.g., `app-state.js` is loaded as a classic script).【F:index.html†L1432-L1471】
2. Enumerate global variables that `app.js` and its peers set on `window` so we can deliberately expose them in a controlled way once bundled by Vite.【F:src/app.js†L35-L63】
3. Document CSS and static asset expectations (for example, theme CSS loaded dynamically in `src/theme.js`, localization assets in `localization/`, and image/font paths) because Vite will need to serve them from `/public` or import them explicitly.【F:src/theme.js†L1-L56】

### 2. Introduce Vite scaffolding without breaking existing flows
1. Add Vite (`npm install --save-dev vite`) and create `vite.config.js` that configures:
   - The HTML entry (`index.html`) as Vite’s root.
   - Aliases for frequently imported modules if helpful (e.g., resolve `$` prefixed files).
   - Static asset directories (e.g., move `styles`, `images`, `localization`, `lib` into `public` or use copy plugins).
2. Update `package.json` scripts to add `vite`-based dev (`vite dev`) and build commands, keeping existing scripts temporarily for fallback until parity is proven.【F:package.json†L108-L139】
3. Ensure Electron integration: since the Electron main process still loads from `src/electron-main.js`, keep Electron Forge scripts but adjust renderer paths to point at the Vite dev server in development and to Vite’s `dist` output in production.

### 3. Migrate HTML entry to Vite semantics
1. Convert `index.html` into a Vite entry template:
   - Replace individual `<script type="module" src="...">` tags with a single script that imports the new entry (e.g., `/src/main.js`).
   - Move `defer`/classic scripts (`src/app-state.js`) to modules or inline dynamic imports so Vite can process them; use `import "./app-state.js";` to preserve side effects.
   - Preserve meta tags and CSP requirements by mirroring them inside the Vite-served HTML (Vite supports `<meta http-equiv>` entries).
2. Add a new `src/main.js` (or TypeScript equivalent) that reproduces the current load order via explicit imports so bundling remains deterministic:
   ```js
   import "./helpers.js";
   import "./storage.js";
   import "./$Component.js";
   // ...
   import "./app.js";
   import "./sessions.js";
   ```
   This file will become the single entry point for Vite while maintaining side effects.
3. Validate that runtime globals expected by other integrations (e.g., `window.systemHooks`, `window.update_fill_and_stroke_colors_and_lineWidth`) are still set. If tree-shaking removes them, explicitly re-export them from the entry (`window.update_fill... = update_fill...`).【F:src/app.js†L35-L63】

### 4. Adjust asset loading for Vite
1. Move CSS build outputs and vendor CSS (`lib/os-gui`, `lib/98.css`) into Vite’s asset pipeline. Either copy them into `public/` for now or import them in `main.js` (Vite will process CSS imports).
2. Update dynamic theme loading in `src/theme.js` so that `href_for(theme)` resolves relative to Vite’s base path (e.g., `/styles/themes/${theme}`) or convert themes to modules imported via Vite’s glob imports.【F:src/theme.js†L1-L56】
3. Audit asset references inside JS for relative path assumptions (for example, `images/icons/...` in `index.html`). Adjust to use `new URL("../images/...", import.meta.url)` where bundling is required.

### 5. Update development workflows
1. Replace `npm run dev` to launch `vite dev` plus any CSS watchers (decide whether to keep `rtlcss` or replace with PostCSS plugins run by Vite). Update documentation (`README.md`) to explain the new flow.
2. Update Cypress and other automation to target the Vite dev server port (default 5173) or start Vite in preview mode during tests. Ensure `start-server-and-test` scripts reference the new commands.【F:package.json†L120-L139】
3. Introduce linting or TypeScript integrations Vite supports (e.g., ESLint plugin, `tsconfig` path mapping) to catch module resolution issues early.

### 6. Hardening before React work
1. Verify production build output matches expectations by deploying Vite’s `dist` to a staging environment or running the Electron app against the generated files.
2. Monitor bundle size and module chunks; consider code-splitting heavy features (e.g., `speech-recognition.js`, `eye-gaze-mode.js`) using dynamic imports to preserve load performance.
3. Freeze the migration once parity is confirmed so React work can start from a stable baseline.

## Phase 2 – Comprehensive React migration plan

### 1. Foundational groundwork
1. Establish project-wide TypeScript or JSDoc conventions for React components. The codebase already uses JSDoc for types (see `src/app.js`), so decide whether to continue with `// @ts-check` and `.jsx` files or move to `.tsx` with a `tsconfig` aligned to React.【F:src/app.js†L1-L19】
2. Introduce React and React DOM (`npm install react react-dom`) along with supporting typings if TypeScript is adopted.
3. Decide on a state management strategy. The existing code uses a mixture of mutable globals (e.g., `selected_tool`, `palette`) and custom event emitters (`$G`). Catalog these in a migration spreadsheet so each global has a React state counterpart or context provider planned.【F:src/app.js†L1-L63】【F:src/functions.js†L180-L240】
4. Create a React root entry (`src/main.js`) that renders into the body or a dedicated `<div id="root">`. For coexistence with legacy DOM during the transition, mount React inside a container and let legacy scripts populate the rest until replaced.

### 2. Incremental componentization strategy
1. Map existing UI modules to candidate React components:
   - Toolbars and floating windows produced via `$Component` / `$ToolWindow` become React components (`<Toolbox />`, `<ColorBox />`).【F:src/'$Component.js'†L48-L120】
   - Canvas workspace managed in `src/app.js` (`main_canvas`, `Handles`) becomes a React-managed canvas component where imperative APIs are exposed via refs.【F:src/app.js†L15-L32】【F:src/Handles.js†L1-L80】
   - Dialogs built with `showMessageBox` / `menus.js` can be wrapped in React portals over time.【F:src/msgbox.js†L1-L80】【F:src/menus.js†L1-L60】
2. Prioritize components that have clearer boundaries (e.g., menus, tool options panels) for the first React conversions to reduce risk.
3. For each targeted component:
   - Translate the markup defined in HTML templates or created via jQuery into JSX.
   - Replace direct DOM manipulation with React state/props; where imperative behavior is unavoidable (dragging, canvas rendering), isolate it in `useEffect` hooks.
   - Re-implement event wiring using React synthetic events, ensuring keyboard and pointer interactions remain intact (review existing handlers in `src/app.js` and `src/tools.js`).【F:src/tools.js†L1-L80】

### 3. State migration plan
1. Introduce a central React state (e.g., using Context + reducers) to hold application-wide data (current tool, colors, canvas history). Start by mirroring the existing global variables and gradually replace reads/writes in legacy modules with context-aware hooks.
2. Wrap legacy modules that must remain temporarily (e.g., specialized algorithms in `functions.js`) so they receive state via arguments instead of reaching for globals.
3. Convert the command/history system managed in `functions.js` to a React-friendly service (possibly using Zustand or Redux Toolkit if reducers become complex). Ensure undo/redo still interacts correctly with the canvas state.【F:src/functions.js†L2400-L2520】
4. Plan for asynchronous features (speech recognition, Discord activity, Imgur integration) to run through React effects or dedicated service layers to avoid side effects outside React’s lifecycle.【F:src/speech-recognition.js†L1-L80】【F:src/imgur.js†L1-L80】

### 4. Rendering and performance considerations
1. Benchmark current canvas rendering flows (`make_canvas`, `update_helper_layer`, `Handles`) to understand which pieces must stay imperative. Create React wrapper components that expose imperative methods via `forwardRef` so tools can manipulate the canvas without causing unnecessary rerenders.【F:src/helpers.js†L1-L40】【F:src/Handles.js†L200-L320】
2. Use React’s lazy loading to defer heavy optional features (e.g., `simulate-random-gestures`, `eye-gaze-mode`) similar to how Vite dynamic imports were planned, keeping initial bundle size manageable.【F:src/simulate-random-gestures.js†L1-L40】【F:src/eye-gaze-mode.js†L1-L80】
3. Introduce unit tests around newly created components to ensure refactoring does not regress behavior. Consider using React Testing Library plus Jest, leveraging existing Cypress tests for end-to-end validation.

### 5. Migration sequencing
1. Phase 0: Ship Vite-only build (from earlier phase) and freeze new features.
2. Phase 1: Introduce React root and render a minimal shell (e.g., the surrounding chrome) while keeping tool interactions powered by legacy code.
3. Phase 2: Convert sidebar/tool windows to React components that read/write from shared state.
4. Phase 3: Port the canvas interaction layer, encapsulating drawing logic in React-managed hooks/services.
5. Phase 4: Replace remaining modals/menus with React equivalents, remove jQuery dependencies, and delete the legacy module loader scaffolding.
6. Final phase: Enable strict mode, remove `window` globals, and document the new architecture in `README.md` and developer guides.

### 6. Risk mitigation and documentation
1. Maintain feature parity by keeping Cypress regression tests running throughout; update selectors to target stable data attributes introduced during the React migration.
2. Document each conversion step in `MIGRATE.md`, updating checklists as modules move to React.
3. Provide developer onboarding docs covering the React architecture, state management choices, and coding conventions so contributors can align with the new system.

This plan should guide the project through adopting Vite for modern tooling and subsequently re-platforming the UI onto React with minimal service disruption.

## Progress Log
- 2025-10-06: Introduced Vite-driven build setup, consolidated legacy script load order into `src/main.js`, mounted a no-op React bridge in `src/react`, and swapped `index.html` to bootstrap through the new entry without altering UI behavior.
