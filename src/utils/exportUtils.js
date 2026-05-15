import { drawGrid, drawObject } from './canvasUtils';

export function renderProjectToCanvas(project, width, height, background, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(options.offsetX || 0, options.offsetY || 0);
  ctx.scale(options.zoom || 1, options.zoom || 1);

  if (project.gridEnabled) {
    drawGrid(
      ctx,
      { zoom: options.zoom || 1, offsetX: options.offsetX || 0, offsetY: options.offsetY || 0 },
      { width, height },
    );
  }

  const visibleLayers = new Set(project.layers.filter((layer) => layer.visible).map((layer) => layer.id));
  project.objects
    .filter((object) => visibleLayers.has(object.layerId) && object.visible !== false)
    .forEach((object) => drawObject(ctx, object));
  ctx.restore();

  return canvas;
}

export function exportCanvasImage(project, width, height, background, type = 'png') {
  const canvas = renderProjectToCanvas(project, width, height, background);
  const mime = type === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mime, 1);
}

export function downloadDataUrl(filename, dataUrl) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function copyCanvasToClipboard(project, width, height, background) {
  const canvas = renderProjectToCanvas(project, width, height, background);
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Clipboard export failed.'));
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function exportProjectSvg(project, width, height, background) {
  const visibleLayers = new Set(project.layers.filter((layer) => layer.visible).map((layer) => layer.id));
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${background}" />`,
  ];

  project.objects
    .filter((object) => visibleLayers.has(object.layerId) && object.visible !== false)
    .forEach((object) => {
      if (object.type === 'line' || object.type === 'arrow') {
        parts.push(
          `<line x1="${object.x1}" y1="${object.y1}" x2="${object.x2}" y2="${object.y2}" stroke="${object.strokeColor}" stroke-width="${object.strokeWidth}" stroke-linecap="round" stroke-dasharray="${object.dashed ? '10 8' : ''}" opacity="${object.opacity ?? 1}" />`,
        );
      } else if (object.type === 'rect' || object.type === 'filled-rect') {
        parts.push(
          `<rect x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" stroke="${object.strokeColor}" fill="${object.fillColor || 'transparent'}" stroke-width="${object.strokeWidth}" opacity="${object.opacity ?? 1}" rx="4" ry="4" />`,
        );
      } else if (object.type === 'ellipse' || object.type === 'filled-ellipse') {
        parts.push(
          `<ellipse cx="${object.x + object.width / 2}" cy="${object.y + object.height / 2}" rx="${Math.abs(object.width / 2)}" ry="${Math.abs(object.height / 2)}" stroke="${object.strokeColor}" fill="${object.fillColor || 'transparent'}" stroke-width="${object.strokeWidth}" opacity="${object.opacity ?? 1}" />`,
        );
      } else if (object.type === 'triangle') {
        parts.push(
          `<polygon points="${object.x + object.width / 2},${object.y} ${object.x},${object.y + object.height} ${object.x + object.width},${object.y + object.height}" stroke="${object.strokeColor}" fill="${object.fillColor || 'transparent'}" stroke-width="${object.strokeWidth}" opacity="${object.opacity ?? 1}" />`,
        );
      } else if (object.type === 'text') {
        parts.push(
          `<text x="${object.x}" y="${object.y + object.fontSize}" fill="${object.strokeColor}" font-size="${object.fontSize}" font-weight="${object.bold ? '700' : '400'}" font-style="${object.italic ? 'italic' : 'normal'}" opacity="${object.opacity ?? 1}">${escapeXml(object.text)}</text>`,
        );
      } else if (object.type === 'freehand' && object.points?.length) {
        const path = object.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
        parts.push(
          `<path d="${path}" fill="none" stroke="${object.strokeColor}" stroke-width="${object.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${object.opacity ?? 1}" />`,
        );
      } else if (object.type === 'image' && object.src) {
        parts.push(
          `<image href="${object.src}" x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" opacity="${object.opacity ?? 1}" />`,
        );
      }
    });

  parts.push('</svg>');
  return parts.join('');
}

function escapeXml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
