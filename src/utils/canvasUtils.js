import { TOOL_IDS } from '../constants/tools';
import { getBoundsFromPoints, pointInEllipse, pointInRect, pointNearLine } from './geometryUtils';

export function createId(prefix = 'obj') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDefaultLayer() {
  return {
    id: 'layer-1',
    name: 'Layer 1',
    visible: true,
    locked: false,
  };
}

export function getEmptyProject() {
  return {
    objects: [],
    layers: [getDefaultLayer()],
    background: '#ffffff',
    gridEnabled: false,
    snapToGrid: false,
    blackboardMode: false,
    recentColors: ['#000000', '#ef4444', '#3b82f6'],
  };
}

export function getObjectBounds(object) {
  if (!object) return { x: 0, y: 0, width: 0, height: 0 };
  if (object.type === 'freehand' || object.type === 'eraser') return getBoundsFromPoints(object.points);
  if (object.type === 'line' || object.type === 'arrow') {
    const minX = Math.min(object.x1, object.x2);
    const minY = Math.min(object.y1, object.y2);
    return {
      x: minX,
      y: minY,
      width: Math.abs(object.x2 - object.x1),
      height: Math.abs(object.y2 - object.y1),
    };
  }
  if (object.type === 'text') {
    return {
      x: object.x,
      y: object.y,
      width: object.width || object.text.split('\n').reduce((max, line) => Math.max(max, line.length), 0) * object.fontSize * 0.7 + 24,
      height: object.height || object.text.split('\n').length * object.fontSize * 1.45 + 24,
    };
  }
  return { x: object.x, y: object.y, width: object.width || 0, height: object.height || 0 };
}

function applyStyle(ctx, object) {
  ctx.globalAlpha = object.opacity ?? 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = object.strokeWidth || 2;
  ctx.strokeStyle = object.strokeColor || '#111827';
  ctx.fillStyle = object.fillColor || 'transparent';
  if (object.dashed) {
    ctx.setLineDash([10, 8]);
  } else {
    ctx.setLineDash([]);
  }
}

function drawArrowHead(ctx, from, to, color, width) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = Math.max(12, width * 3);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawFreehand(ctx, object) {
  const points = object.points || [];
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;
    const midY = (previous.y + point.y) / 2;
    ctx.quadraticCurveTo(previous.x, previous.y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawImageObject(ctx, object) {
  if (!object.imageElement) return;
  ctx.drawImage(object.imageElement, object.x, object.y, object.width, object.height);
}

export function drawObject(ctx, object) {
  if (!object || object.visible === false) return;
  ctx.save();
  applyStyle(ctx, object);

  switch (object.type) {
    case 'freehand':
    case 'eraser':
      if (object.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      }
      drawFreehand(ctx, object);
      break;
    case 'line':
    case 'arrow':
      ctx.beginPath();
      ctx.moveTo(object.x1, object.y1);
      ctx.lineTo(object.x2, object.y2);
      ctx.stroke();
      if (object.type === 'arrow') {
        drawArrowHead(
          ctx,
          { x: object.x1, y: object.y1 },
          { x: object.x2, y: object.y2 },
          object.strokeColor,
          object.strokeWidth,
        );
      }
      break;
    case 'rect':
    case 'filled-rect':
      if (object.type === 'filled-rect' || object.fillColor) {
        ctx.fillRect(object.x, object.y, object.width, object.height);
      }
      ctx.strokeRect(object.x, object.y, object.width, object.height);
      break;
    case 'ellipse':
    case 'filled-ellipse':
      ctx.beginPath();
      ctx.ellipse(
        object.x + object.width / 2,
        object.y + object.height / 2,
        Math.abs(object.width / 2),
        Math.abs(object.height / 2),
        0,
        0,
        Math.PI * 2,
      );
      if (object.type === 'filled-ellipse' || object.fillColor) {
        ctx.fill();
      }
      ctx.stroke();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(object.x + object.width / 2, object.y);
      ctx.lineTo(object.x, object.y + object.height);
      ctx.lineTo(object.x + object.width, object.y + object.height);
      ctx.closePath();
      if (object.fillColor) ctx.fill();
      ctx.stroke();
      break;
    case 'text':
      ctx.font = `${object.italic ? 'italic ' : ''}${object.bold ? 'bold ' : ''}${object.fontSize || 24}px sans-serif`;
      ctx.textBaseline = 'top';
      if (object.fillColor && object.fillColor !== 'transparent') {
        ctx.fillStyle = object.fillColor;
        ctx.fillRect(object.x, object.y, object.width, object.height);
      }
      if (object.boxStrokeColor) {
        ctx.strokeStyle = object.boxStrokeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(object.x, object.y, object.width, object.height);
      }
      ctx.fillStyle = object.strokeColor;
      object.text.split('\n').forEach((line, index) => {
        ctx.fillText(line, object.x + 12, object.y + 12 + index * (object.fontSize || 24) * 1.35);
      });
      break;
    case 'image':
      drawImageObject(ctx, object);
      break;
    default:
      break;
  }

  ctx.restore();
}

export function drawGrid(ctx, viewport, canvasSize, color = 'rgba(148, 163, 184, 0.15)', size = 50) {
  const { zoom, offsetX, offsetY } = viewport;
  const worldLeft = -offsetX / zoom;
  const worldTop = -offsetY / zoom;
  const worldRight = worldLeft + canvasSize.width / zoom;
  const worldBottom = worldTop + canvasSize.height / zoom;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([]);

  const startX = Math.floor(worldLeft / size) * size;
  const startY = Math.floor(worldTop / size) * size;

  for (let x = startX; x <= worldRight; x += size) {
    ctx.beginPath();
    ctx.moveTo(x, worldTop);
    ctx.lineTo(x, worldBottom);
    ctx.stroke();
  }

  for (let y = startY; y <= worldBottom; y += size) {
    ctx.beginPath();
    ctx.moveTo(worldLeft, y);
    ctx.lineTo(worldRight, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function hitTestObject(object, point) {
  const bounds = getObjectBounds(object);

  switch (object.type) {
    case 'freehand':
    case 'eraser':
      return (object.points || []).some((pt) => pointInRect(point, { x: pt.x - 8, y: pt.y - 8, width: 16, height: 16 }));
    case 'line':
    case 'arrow':
      return pointNearLine(point, { x: object.x1, y: object.y1 }, { x: object.x2, y: object.y2 }, 8 + (object.strokeWidth || 2));
    case 'ellipse':
    case 'filled-ellipse':
      return pointInEllipse(point, object);
    case 'triangle':
    case 'rect':
    case 'filled-rect':
    case 'text':
    case 'image':
      return pointInRect(point, bounds, 8);
    default:
      return false;
  }
}

export function getCursorForTool(tool, isPanning = false) {
  if (isPanning) return 'grabbing';
  switch (tool) {
    case TOOL_IDS.SELECT:
      return 'default';
    case TOOL_IDS.ERASER:
      return 'cell';
    case TOOL_IDS.TEXT:
      return 'text';
    case TOOL_IDS.HAND:
      return 'grab';
    default:
      return 'crosshair';
  }
}

export function projectToSerializable(project) {
  return {
    ...project,
    objects: project.objects.map((object) => {
      if (object.type !== 'image') return object;
      return {
        ...object,
        imageElement: undefined,
      };
    }),
  };
}
