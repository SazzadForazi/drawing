export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalizeRect(x1, y1, x2, y2, shiftKey = false) {
  let width = x2 - x1;
  let height = y2 - y1;

  if (shiftKey) {
    const size = Math.max(Math.abs(width), Math.abs(height));
    width = Math.sign(width || 1) * size;
    height = Math.sign(height || 1) * size;
  }

  return {
    x: width < 0 ? x1 + width : x1,
    y: height < 0 ? y1 + height : y1,
    width: Math.abs(width),
    height: Math.abs(height),
  };
}

export function angleSnap(start, end) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const length = distance(start, end);
  return {
    x: start.x + Math.cos(snapped) * length,
    y: start.y + Math.sin(snapped) * length,
  };
}

export function getBoundsFromPoints(points = []) {
  if (!points.length) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function pointInRect(point, rect, padding = 0) {
  return (
    point.x >= rect.x - padding &&
    point.x <= rect.x + rect.width + padding &&
    point.y >= rect.y - padding &&
    point.y <= rect.y + rect.height + padding
  );
}

export function pointNearLine(point, start, end, threshold = 8) {
  const lineLength = distance(start, end);
  if (!lineLength) return distance(point, start) <= threshold;

  const t =
    ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) /
    lineLength ** 2;
  const clampedT = clamp(t, 0, 1);
  const projection = {
    x: start.x + clampedT * (end.x - start.x),
    y: start.y + clampedT * (end.y - start.y),
  };
  return distance(point, projection) <= threshold;
}

export function pointInEllipse(point, shape) {
  const rx = shape.width / 2 || 1;
  const ry = shape.height / 2 || 1;
  const cx = shape.x + rx;
  const cy = shape.y + ry;
  return ((point.x - cx) ** 2) / (rx ** 2) + ((point.y - cy) ** 2) / (ry ** 2) <= 1;
}

export function resizeFromHandle(object, handle, anchor, nextPoint, keepAspectRatio = false) {
  const x1 = handle.includes('w') ? nextPoint.x : anchor.x;
  const y1 = handle.includes('n') ? nextPoint.y : anchor.y;
  const x2 = handle.includes('w') ? anchor.x : nextPoint.x;
  const y2 = handle.includes('n') ? anchor.y : nextPoint.y;
  const rect = normalizeRect(x1, y1, x2, y2, keepAspectRatio);
  return {
    ...rect,
    width: Math.max(32, rect.width),
    height: Math.max(32, rect.height),
  };
}
