# ProDraw Board

Professional browser-based whiteboard and drawing workspace built with React, Vite, HTML5 Canvas, Tailwind CSS, and Lucide icons.

## Features

- Smooth freehand drawing with Pointer Events, pressure-aware strokes, touch support, and high-DPI rendering
- Select, move, resize, erase, draw shapes, add text, upload images, pan, zoom, and export work
- Layers, ordering controls, grouping, autosave, undo/redo history, recent colors, grid, snap, and blackboard mode
- Export as PNG, JPEG, SVG, clipboard image, and project JSON
- Load project JSON back into the board

## Installation

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Usage Guide

- Draw with the left toolbar or keyboard shortcuts
- Use `Space + drag` to pan and `Ctrl + mouse wheel` to zoom
- Click with the text tool to type directly onto the board
- Use the top bar for save, export, grid, snap, and board mode
- Use the right panel for colors, brush settings, ordering, grouping, and layers

## Keyboard Shortcuts

- `P` pencil
- `E` eraser
- `V` select
- `T` text
- `R` rectangle
- `C` circle
- `L` line
- `A` arrow
- `Ctrl + Z` undo
- `Ctrl + Y` redo
- `Ctrl + S` save locally
- `Delete` remove selection
- `Esc` cancel current action
- `Space + drag` pan
- `Ctrl + mouse wheel` zoom

## File Guide

- `src/App.jsx`: app composition, layout, responsive shell, hidden file inputs, floating panels
- `src/hooks/useCanvasEngine.js`: canvas object model, drawing engine, selection, transforms, export, layers, toasts
- `src/hooks/useKeyboardShortcuts.js`: keyboard mappings
- `src/hooks/useHistory.js`: undo/redo stack
- `src/hooks/useAutosave.js`: debounced local autosave
- `src/components/`: toolbar, top bar, layers, color controls, brush settings, status bar, inline text editor
- `src/utils/canvasUtils.js`: object drawing, hit testing, bounds, project helpers
- `src/utils/exportUtils.js`: PNG/JPEG/SVG/clipboard export helpers
- `src/utils/geometryUtils.js`: math utilities for snapping, resizing, bounds, hit regions
- `src/utils/storageUtils.js`: localStorage save/load and file download helpers
- `src/constants/`: tool and color definitions

## Local Save Behavior

- Autosaves to `localStorage`
- Manual Save also writes to `localStorage`
- JSON export preserves layers, objects, colors, background, and images stored as data URLs

## Netlify Deployment

1. Push the project to GitHub.
2. Create a new Netlify site from that repository.
3. Use:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy.

For SPA routing safety, this app does not need custom redirect rules because it stays on a single route.

## Future Improvements

- Better freehand point simplification and smoothing
- Multi-object resize handles and rotation
- Better text editing with multiline rich text
- Layer renaming UI
- IndexedDB persistence for larger image-heavy projects
- Better SVG export for arrows and grouped objects
- Collaboration and live cursors
