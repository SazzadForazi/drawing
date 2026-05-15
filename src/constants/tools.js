import { createElement } from 'react';
import {
  ArrowRight,
  Eraser,
  Hand,
  Highlighter,
  ImagePlus,
  MousePointer2,
  Move,
  PenTool,
  Pencil,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Minus,
  Triangle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

function OutlineRectangleIcon({ className }) {
  return createElement(
    'svg',
    { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', className, 'aria-hidden': 'true' },
    createElement('rect', { x: '4', y: '6', width: '16', height: '12', rx: '2.5' }),
  );
}

function FilledRectangleIcon({ className }) {
  return createElement(
    'svg',
    { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', className, 'aria-hidden': 'true' },
    createElement('rect', { x: '4', y: '6', width: '16', height: '12', rx: '2.5' }),
    createElement('rect', { x: '7', y: '9', width: '10', height: '6', rx: '1.5', fill: 'currentColor', stroke: 'none', opacity: '0.85' }),
  );
}

function OutlineCircleIcon({ className }) {
  return createElement(
    'svg',
    { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', className, 'aria-hidden': 'true' },
    createElement('circle', { cx: '12', cy: '12', r: '7.5' }),
  );
}

function FilledCircleIcon({ className }) {
  return createElement(
    'svg',
    { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', className, 'aria-hidden': 'true' },
    createElement('circle', { cx: '12', cy: '12', r: '7.5' }),
    createElement('circle', { cx: '12', cy: '12', r: '4.5', fill: 'currentColor', stroke: 'none', opacity: '0.85' }),
  );
}

export const TOOL_IDS = {
  SELECT: 'select',
  PENCIL: 'pencil',
  PEN: 'pen',
  HIGHLIGHTER: 'highlighter',
  ERASER: 'eraser',
  LINE: 'line',
  ARROW: 'arrow',
  RECT: 'rect',
  FILLED_RECT: 'filled-rect',
  ELLIPSE: 'ellipse',
  FILLED_ELLIPSE: 'filled-ellipse',
  TRIANGLE: 'triangle',
  TEXT: 'text',
  IMAGE: 'image',
  HAND: 'hand',
  ZOOM_IN: 'zoom-in',
  ZOOM_OUT: 'zoom-out',
};

export const TOOL_LIST = [
  { id: TOOL_IDS.SELECT, label: 'Select', shortcut: 'V', icon: MousePointer2 },
  { id: TOOL_IDS.PENCIL, label: 'Pencil', shortcut: 'P', icon: Pencil },
  { id: TOOL_IDS.PEN, label: 'Pen', shortcut: 'Shift+P', icon: PenTool },
  { id: TOOL_IDS.HIGHLIGHTER, label: 'Highlighter', shortcut: 'H', icon: Highlighter },
  { id: TOOL_IDS.ERASER, label: 'Eraser', shortcut: 'E', icon: Eraser },
  { id: TOOL_IDS.LINE, label: 'Line', shortcut: 'L', icon: Minus },
  { id: TOOL_IDS.ARROW, label: 'Arrow', shortcut: 'A', icon: ArrowRight },
  { id: TOOL_IDS.RECT, label: 'Rectangle', shortcut: 'R', icon: OutlineRectangleIcon },
  { id: TOOL_IDS.FILLED_RECT, label: 'Filled Rect', shortcut: 'Shift+R', icon: FilledRectangleIcon },
  { id: TOOL_IDS.ELLIPSE, label: 'Circle', shortcut: 'C', icon: OutlineCircleIcon },
  { id: TOOL_IDS.FILLED_ELLIPSE, label: 'Filled Circle', shortcut: 'Shift+C', icon: FilledCircleIcon },
  { id: TOOL_IDS.TRIANGLE, label: 'Triangle', shortcut: 'Y', icon: Triangle },
  { id: TOOL_IDS.TEXT, label: 'Text', shortcut: 'T', icon: Type },
  { id: TOOL_IDS.IMAGE, label: 'Image', shortcut: 'I', icon: ImagePlus },
  { id: TOOL_IDS.HAND, label: 'Hand', shortcut: 'Space', icon: Hand },
];

export const ACTION_BUTTONS = {
  undo: { id: 'undo', label: 'Undo', icon: Undo2 },
  redo: { id: 'redo', label: 'Redo', icon: Redo2 },
  clear: { id: 'clear', label: 'Clear', icon: Trash2 },
  download: { id: 'download', label: 'Download PNG', icon: Download },
  zoomIn: { id: 'zoom-in', label: 'Zoom In', icon: ZoomIn },
  zoomOut: { id: 'zoom-out', label: 'Zoom Out', icon: ZoomOut },
};
