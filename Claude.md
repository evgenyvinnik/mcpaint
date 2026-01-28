# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MCPaint is a pixel-perfect MS Paint clone built with React, Vite, Zustand, and IndexedDB. Based on [JS Paint](https://jspaint.app), it recreates all 16 MS Paint tools with high fidelity. Deployed on Vercel with Edge Functions for AI-powered natural language drawing.

## Quick Start

```bash
npm i                    # Install dependencies
npm run dev              # Start dev server (http://localhost:1999/)
npm run lint             # Check for errors before committing
npm run test             # Run Playwright tests
```

## Commands

```bash
# Development
npm run dev              # Dev server with CSS watch (port 1999)
npm run build            # Production build to /dist/
npm run preview          # Preview production build (port 4173)

# Linting & Formatting
npm run lint             # Run all linters (cspell, tsc, eslint)
npm run lint-tsc-react   # TypeScript checking for React code
npm run lint-eslint      # ESLint only
npm run format           # Format React code with Prettier

# Testing (Playwright against port 11822, auto-started)
npm run test                              # Run all tests
npm run test -- tests/tools.spec.ts       # Single file
npm run test -- tests/dialogs/            # All dialog tests
npm run test -- -g "pencil tool"          # Pattern match
npm run test:headed                       # Visible browser
npm run test:ui                           # Playwright UI
npm run test:debug                        # Step-through debugging
npm run test:update-snapshots             # Update visual snapshots

# Localization
npm run update-localization  # Preprocess Windows .rc files to JSON
```

## Architecture

### React App (`src/react/`)

**React Compiler** - Uses `babel-plugin-react-compiler` for automatic optimization. Manual `useMemo`/`useCallback` is unnecessary.

**State Management (Zustand)** - 6 stores in `src/react/context/state/`:
- `toolStore.ts` - Active tool, selection, text box, clipboard
- `settingsStore.ts` - Drawing settings (brush, eraser, shapes, fonts)
- `uiStore.ts` - UI visibility, magnification, open dialogs
- `historyStore.ts` - Tree-based undo/redo with branching
- `canvasStore.ts` - Canvas metadata (dimensions, file name)
- `aiStore.ts` - AI chat state (messages, streaming, execution progress)

**Selector Hooks** - Located alongside stores (e.g., `useColors.ts`, `useBrushSettings.ts`). Use `useShallow` from Zustand to prevent unnecessary re-renders.

**Persistence** - `persistence.ts` provides IndexedDB storage via the `idb` library. Database: `mcpaint-db`. See [docs/CANVAS_PERSISTENCE.md](docs/CANVAS_PERSISTENCE.md) for the two-tier strategy (module-level + IndexedDB).

**Canvas Architecture** (`src/react/components/Canvas.tsx`):
- Orchestrates specialized hooks for drawing, selection, shapes, text
- `useCanvasEventHandlers` - Centralized event delegation to tool-specific hooks
- `useCanvasLifecycle` - Initialization and cleanup
- Module-level state persists canvas data across React remounts (for HMR and Strict Mode)

**Canvas Hooks** (`src/react/hooks/`):
- Drawing: `useCanvasDrawing`, `useAirbrushEffect`
- Selection: `useCanvasSelection`, `useRectangularSelection`, `useFreeFormSelection`
- Shapes: `useCanvasShapes`, `useCanvasCurvePolygon`
- Text: `useCanvasTextBox`, `useFontState`
- Events: `useCanvasEventHandlers`, `useCanvasLifecycle`, `useKeyboardShortcuts`
- AI: `useAIChat`, `useCommandExecutor`

**Pure Utilities** (`src/react/utils/`):
- `drawingUtils.ts` - Bresenham line, flood fill, shape algorithms
- `imageTransforms.ts` - Flip, rotate, stretch, skew
- `historyTree.ts` - Non-linear undo/redo tree structure
- `colorUtils.ts` - Color space conversion (RGB, HSL, hex)

**Dialogs** - Portal-based in `src/react/components/dialogs/`. Rendered via `DialogManager` based on `uiStore.dialogs` state.

**i18n** - Uses i18next with JSON translations in `/public/locales/`. 26 languages supported including RTL (Arabic, Hebrew). All UI text uses `useTranslation()` hook.

### Build System

Vite multi-page app with React Compiler enabled. Entry points: `index.html`, `about.html`, `privacy.html`.

**CSS RTL** - `styles/layout.css` is auto-processed by RTLCSS to generate `layout.rtl.css`. Test RTL by switching to Arabic or Hebrew.

### AI Integration

Natural language canvas control via Claude API with SSE streaming. The AI executes 50+ drawing commands covering all Paint functionality.

**Architecture**:
- `api/ai/draw.ts` - Vercel Edge Function proxying Claude API with tool calling
- `src/react/services/aiService.ts` - SSE client handling streaming responses
- `src/react/hooks/useCommandExecutor.ts` - Maps AI commands to drawing utilities
- `src/react/components/ai/` - Chat UI components

**Command Categories**: drawing (16 tools), selection, canvas, color, edit, transform, view, batch operations.

**Environment**: Set `ANTHROPIC_API_KEY` in Vercel environment or `.env.local`.

**Access**: View > AI Assistant. See [docs/AI.md](docs/AI.md) for command specifications.

## Testing

**Configuration** (`playwright.config.ts`):
- Chromium only
- 30s test timeout, 10s expect timeout
- Screenshots/video on failure
- Visual snapshots with `toHaveScreenshot()` (max 100 pixel diff)

**Test Organization**:
- `tests/*.spec.ts` - Core tool and menu tests
- `tests/dialogs/` - Dialog-specific tests
- `tests/utils/` - Shared utilities (`canvas-helpers.ts`, `dialog-helpers.ts`)

## Code Conventions

- `camelCase` for functions/variables, `PascalCase` for components
- Files: `*.tsx` for React components, `*.ts` for utilities/hooks
- JSDoc with `@param` and `@returns` for all React functions
- TypeScript uses JSDoc annotations (not `.d.ts` files)
- Path aliases: `@/*` → `src/*`, `@react/*` → `src/react/*`

## Drawing Tools

16 tools: Free-Form Select, Rectangular Select, Eraser, Fill (flood fill), Pick Color (eyedropper), Magnifier (1x-8x zoom), Pencil, Brush, Airbrush, Text, Line (Bresenham), Curve (cubic bezier), Rectangle, Polygon, Ellipse, Rounded Rectangle.

## Debugging

- **Clear IndexedDB**: DevTools > Application > IndexedDB > delete `mcpaint-db`
- **VS Code**: Launch config in `.vscode/launch.json` for Chrome debugging
