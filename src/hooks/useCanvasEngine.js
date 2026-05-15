import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BLACKBOARD_BACKGROUND, DEFAULT_BACKGROUND, QUICK_COLORS } from '../constants/colors';
import { TOOL_IDS } from '../constants/tools';
import {
  createId,
  drawGrid,
  drawObject,
  getCursorForTool,
  getEmptyProject,
  getObjectBounds,
  hitTestObject,
  projectToSerializable,
} from '../utils/canvasUtils';
import { angleSnap, clamp, normalizeRect, pointInRect, resizeFromHandle } from '../utils/geometryUtils';
import { copyCanvasToClipboard, downloadDataUrl, exportCanvasImage, exportProjectSvg } from '../utils/exportUtils';
import { useHistory } from './useHistory';
import { downloadTextFile, loadProjectFromStorage, saveProjectToStorage } from '../utils/storageUtils';

const DEFAULT_TOOL_OPTIONS = {
  strokeColor: '#f8fafc',
  fillColor: '#1ecb81',
  strokeWidth: 3,
  opacity: 1,
  dashed: false,
  fillEnabled: false,
  brushOpacity: 1,
  background: DEFAULT_BACKGROUND,
  fontSize: 28,
  bold: false,
  italic: false,
  smoothness: 0.4,
};

const HANDLE_SIZE = 12;

function cloneSnapshot(project) {
  return JSON.parse(JSON.stringify(projectToSerializable(project)));
}

function canEraseObject(object) {
  return object.type !== 'image';
}

function buildTextboxMetrics(text, fontSize) {
  const lines = text.split('\n');
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  return {
    width: Math.max(180, longest * fontSize * 0.62 + 24),
    height: Math.max(fontSize * 1.6 + 24, lines.length * fontSize * 1.35 + 24),
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function objectSupportsFill(object) {
  return ['rect', 'filled-rect', 'ellipse', 'filled-ellipse', 'triangle', 'text'].includes(object.type);
}

function objectSupportsStroke(object) {
  return object.type !== 'image';
}

function ensureImageElements(objects) {
  return Promise.all(
    objects.map(
      (object) =>
        new Promise((resolve) => {
          if (object.type !== 'image' || !object.src) {
            resolve(object);
            return;
          }
          const image = new Image();
          image.onload = () => resolve({ ...object, imageElement: image });
          image.onerror = () => resolve(object);
          image.src = object.src;
        }),
    ),
  );
}

function getHandleRects(bounds) {
  const { x, y, width, height } = bounds;
  const half = HANDLE_SIZE / 2;
  return {
    nw: { x: x - half, y: y - half, width: HANDLE_SIZE, height: HANDLE_SIZE },
    ne: { x: x + width - half, y: y - half, width: HANDLE_SIZE, height: HANDLE_SIZE },
    sw: { x: x - half, y: y + height - half, width: HANDLE_SIZE, height: HANDLE_SIZE },
    se: { x: x + width - half, y: y + height - half, width: HANDLE_SIZE, height: HANDLE_SIZE },
  };
}

function getHandleAtPoint(bounds, point, padding = 0) {
  const handles = getHandleRects(bounds);
  return Object.entries(handles).find(([, rect]) => pointInRect(point, rect, padding))?.[0] || null;
}

function buildShapeObject(tool, start, current, options, layerId, shiftKey = false) {
  const finalPoint = shiftKey && (tool === TOOL_IDS.LINE || tool === TOOL_IDS.ARROW) ? angleSnap(start, current) : current;
  if (tool === TOOL_IDS.LINE || tool === TOOL_IDS.ARROW) {
    return {
      id: createId(tool),
      type: tool,
      x1: start.x,
      y1: start.y,
      x2: finalPoint.x,
      y2: finalPoint.y,
      strokeColor: options.strokeColor,
      fillColor: 'transparent',
      strokeWidth: options.strokeWidth,
      opacity: options.opacity,
      dashed: options.dashed,
      rotation: 0,
      layerId,
      locked: false,
      visible: true,
    };
  }

  const rect = normalizeRect(start.x, start.y, finalPoint.x, finalPoint.y, shiftKey && tool !== TOOL_IDS.TRIANGLE);
  const typeMap = {
    [TOOL_IDS.RECT]: 'rect',
    [TOOL_IDS.FILLED_RECT]: 'filled-rect',
    [TOOL_IDS.ELLIPSE]: 'ellipse',
    [TOOL_IDS.FILLED_ELLIPSE]: 'filled-ellipse',
    [TOOL_IDS.TRIANGLE]: 'triangle',
  };

  return {
    id: createId(tool),
    type: typeMap[tool],
    ...rect,
    strokeColor: options.strokeColor,
    fillColor: options.fillEnabled || tool.includes('filled') ? options.fillColor : 'transparent',
    strokeWidth: options.strokeWidth,
    opacity: options.opacity,
    dashed: options.dashed,
    rotation: 0,
    layerId,
    locked: false,
    visible: true,
  };
}

export function useCanvasEngine() {
  const initialProject = useMemo(() => {
    const saved = loadProjectFromStorage();
    return saved ? { ...getEmptyProject(), ...saved } : getEmptyProject();
  }, []);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const rafRef = useRef(0);
  const interactionRef = useRef(null);
  const pendingImagePositionRef = useRef({ x: 80, y: 80 });
  const [project, setProject] = useState(initialProject);
  const [activeTool, setActiveTool] = useState(TOOL_IDS.PENCIL);
  const [toolOptions, setToolOptions] = useState({
    ...DEFAULT_TOOL_OPTIONS,
    background: initialProject.background || DEFAULT_BACKGROUND,
    recentColors: initialProject.recentColors || QUICK_COLORS.slice(0, 3),
  });
  const [viewport, setViewport] = useState({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [draftObject, setDraftObject] = useState(null);
  const [status, setStatus] = useState({ toolName: 'Pencil', mouse: { x: 0, y: 0 }, canvas: { width: 0, height: 0 } });
  const [activeLayerId, setActiveLayerId] = useState(initialProject.layers[0]?.id || 'layer-1');
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [textEditor, setTextEditor] = useState(null);
  const [toast, setToast] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toastTimeoutRef = useRef(0);
  const history = useHistory(50);

  const visibleLayerIds = useMemo(
    () => new Set(project.layers.filter((layer) => layer.visible).map((layer) => layer.id)),
    [project.layers],
  );

  const selectedObjects = useMemo(
    () => project.objects.filter((object) => selectedIds.includes(object.id)),
    [project.objects, selectedIds],
  );

  const activeLayer = useMemo(
    () => project.layers.find((layer) => layer.id === activeLayerId) || project.layers[0],
    [activeLayerId, project.layers],
  );

  const showToast = useCallback((message, tone = 'default') => {
    setToast({ message, tone });
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const updateRecentColors = useCallback((color) => {
    setProject((current) => {
      const nextRecent = [color, ...(current.recentColors || []).filter((item) => item !== color)].slice(0, 8);
      return { ...current, recentColors: nextRecent };
    });
  }, []);

  const toWorldPoint = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left - viewport.offsetX) / viewport.zoom,
        y: (event.clientY - rect.top - viewport.offsetY) / viewport.zoom,
      };
    },
    [viewport.offsetX, viewport.offsetY, viewport.zoom],
  );

  const commitProject = useCallback(
    (updater, shouldSaveHistory = true) => {
      setProject((current) => {
        if (shouldSaveHistory) {
          history.pushHistory(cloneSnapshot(current));
        }
        const next = typeof updater === 'function' ? updater(current) : updater;
        return next;
      });
    },
    [history],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      setCanvasSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
      setStatus((current) => ({ ...current, canvas: { width: Math.round(rect.width), height: Math.round(rect.height) } }));
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = toolOptions.background;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.zoom, viewport.zoom);

    if (project.gridEnabled) {
      drawGrid(ctx, viewport, { width: rect.width, height: rect.height });
    }

    project.objects
      .filter((object) => visibleLayerIds.has(object.layerId))
      .forEach((object) => drawObject(ctx, object));

    if (draftObject) {
      drawObject(ctx, draftObject);
    }

    selectedObjects.forEach((object) => {
      const bounds = getObjectBounds(object);
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1.5 / viewport.zoom;
      ctx.setLineDash([6 / viewport.zoom, 4 / viewport.zoom]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.setLineDash([]);
      Object.values(getHandleRects(bounds)).forEach((handle) => {
        ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
        ctx.strokeRect(handle.x, handle.y, handle.width, handle.height);
      });
      ctx.restore();
    });

    ctx.restore();
  }, [draftObject, project.gridEnabled, project.objects, selectedObjects, toolOptions.background, viewport, visibleLayerIds]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(redraw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [redraw]);

  useEffect(() => {
    const resize = () => redraw();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  useEffect(() => {
    ensureImageElements(project.objects).then((objects) => {
      setProject((current) => {
        if (current.objects.every((object, index) => object.imageElement === objects[index].imageElement)) {
          return current;
        }
        return { ...current, objects };
      });
    });
  }, [project.objects.length]);

  useEffect(() => {
    if (project.background && project.background !== toolOptions.background) {
      setToolOptions((current) => ({ ...current, background: project.background }));
    }
  }, [project.background, toolOptions.background]);

  const setTool = useCallback((tool) => {
    setActiveTool(tool);
    setStatus((current) => ({ ...current, toolName: tool }));
  }, []);

  const updateToolOption = useCallback(
    (key, value) => {
      setToolOptions((current) => ({ ...current, [key]: value }));
      if (key === 'strokeColor' || key === 'fillColor') {
        updateRecentColors(value);
      }
      if (key === 'background') {
        setProject((current) => ({ ...current, background: value }));
        return;
      }

      if (!selectedIds.length) return;

      const selectedSet = new Set(selectedIds);
      const styleKeys = new Set(['strokeColor', 'fillColor', 'strokeWidth', 'opacity', 'dashed', 'bold', 'italic', 'fontSize']);
      if (!styleKeys.has(key) && key !== 'fillEnabled') return;

      commitProject((current) => ({
        ...current,
        objects: current.objects.map((object) => {
          if (!selectedSet.has(object.id)) return object;

          if (key === 'strokeColor' && objectSupportsStroke(object)) {
            return { ...object, strokeColor: value };
          }

          if (key === 'fillColor' && objectSupportsFill(object)) {
            return { ...object, fillColor: value };
          }

          if (key === 'strokeWidth' && objectSupportsStroke(object)) {
            return { ...object, strokeWidth: value };
          }

          if (key === 'opacity') {
            return { ...object, opacity: value };
          }

          if (key === 'dashed' && objectSupportsStroke(object)) {
            return { ...object, dashed: value };
          }

          if (key === 'fillEnabled' && objectSupportsFill(object)) {
            return { ...object, fillColor: value ? toolOptions.fillColor : 'transparent' };
          }

          if (object.type === 'text' && (key === 'bold' || key === 'italic' || key === 'fontSize')) {
            const nextObject = { ...object, [key]: value };
            if (key === 'fontSize') {
              return {
                ...nextObject,
                ...buildTextboxMetrics(nextObject.text, value),
              };
            }
            return nextObject;
          }

          return object;
        }),
      }));
    },
    [commitProject, selectedIds, toolOptions.fillColor, updateRecentColors],
  );

  const cancelCurrentAction = useCallback(() => {
    interactionRef.current = null;
    setDraftObject(null);
    setTextEditor(null);
  }, []);

  const deleteSelection = useCallback(() => {
    if (!selectedIds.length) return;
    commitProject((current) => ({
      ...current,
      objects: current.objects.filter((object) => !selectedIds.includes(object.id)),
    }));
    setSelectedIds([]);
  }, [commitProject, selectedIds]);

  const setObjectOrder = useCallback(
    (mode) => {
      if (!selectedIds.length) return;
      commitProject((current) => {
        const objects = [...current.objects];
        selectedIds.forEach((id) => {
          const index = objects.findIndex((object) => object.id === id);
          if (index === -1) return;
          const [item] = objects.splice(index, 1);
          if (mode === 'front') objects.push(item);
          if (mode === 'back') objects.unshift(item);
          if (mode === 'forward') objects.splice(Math.min(objects.length, index + 1), 0, item);
          if (mode === 'backward') objects.splice(Math.max(0, index - 1), 0, item);
        });
        return { ...current, objects };
      });
    },
    [commitProject, selectedIds],
  );

  const duplicateSelection = useCallback(() => {
    if (!selectedObjects.length) return;
    commitProject((current) => {
      const clones = selectedObjects.map((object) => ({
        ...object,
        id: createId(object.type),
        x: object.x !== undefined ? object.x + 24 : object.x,
        y: object.y !== undefined ? object.y + 24 : object.y,
        x1: object.x1 !== undefined ? object.x1 + 24 : object.x1,
        y1: object.y1 !== undefined ? object.y1 + 24 : object.y1,
        x2: object.x2 !== undefined ? object.x2 + 24 : object.x2,
        y2: object.y2 !== undefined ? object.y2 + 24 : object.y2,
        points: object.points?.map((point) => ({ x: point.x + 24, y: point.y + 24 })),
      }));
      return { ...current, objects: [...current.objects, ...clones] };
    });
  }, [commitProject, selectedObjects]);

  const addLayer = useCallback(() => {
    const id = createId('layer');
    setProject((current) => ({
      ...current,
      layers: [...current.layers, { id, name: `Layer ${current.layers.length + 1}`, visible: true, locked: false }],
    }));
    setActiveLayerId(id);
  }, []);

  const updateLayer = useCallback((layerId, updater) => {
    setProject((current) => ({
      ...current,
      layers: current.layers.map((layer) => (layer.id === layerId ? { ...layer, ...updater } : layer)),
    }));
  }, []);

  const deleteLayer = useCallback(
    (layerId) => {
      if (project.layers.length === 1) return;
      const nextActiveLayerId = project.layers.find((layer) => layer.id !== layerId)?.id || activeLayerId;
      commitProject((current) => {
        const layers = current.layers.filter((layer) => layer.id !== layerId);
        const fallbackLayer = layers[0];
        return {
          ...current,
          layers,
          objects: current.objects
            .filter((object) => object.layerId !== layerId)
            .map((object) => ({ ...object, layerId: fallbackLayer.id })),
        };
      });
      setActiveLayerId((current) => (current === layerId ? nextActiveLayerId : current));
    },
    [activeLayerId, commitProject, project.layers],
  );

  const bringProjectState = useCallback(
    async (snapshot) => {
      if (!snapshot) return;
      const hydratedObjects = await ensureImageElements(snapshot.objects || []);
      setProject({ ...getEmptyProject(), ...snapshot, objects: hydratedObjects });
      setToolOptions((current) => ({ ...current, background: snapshot.background || DEFAULT_BACKGROUND }));
      setActiveLayerId(snapshot.layers?.[0]?.id || 'layer-1');
      setSelectedIds([]);
      setDraftObject(null);
    },
    [],
  );

  const handleUndo = useCallback(async () => {
    const snapshot = history.undo(cloneSnapshot(project));
    if (snapshot) {
      await bringProjectState(snapshot);
    }
  }, [bringProjectState, history, project]);

  const handleRedo = useCallback(async () => {
    const snapshot = history.redo(cloneSnapshot(project));
    if (snapshot) {
      await bringProjectState(snapshot);
    }
  }, [bringProjectState, history, project]);

  const saveProject = useCallback(() => {
    saveProjectToStorage(projectToSerializable(project));
    showToast('Project saved locally');
  }, [project, showToast]);

  const clearCanvas = useCallback(() => {
    commitProject((current) => ({ ...current, objects: [] }));
    setSelectedIds([]);
  }, [commitProject]);

  const applySnap = useCallback(
    (point) => {
      if (!project.snapToGrid) return point;
      const step = 25;
      return {
        x: Math.round(point.x / step) * step,
        y: Math.round(point.y / step) * step,
      };
    },
    [project.snapToGrid],
  );

  const updateSelectionObjects = useCallback(
    (updater) => {
      commitProject((current) => ({
        ...current,
        objects: current.objects.map((object) => (selectedIds.includes(object.id) ? updater(object) : object)),
      }));
    },
    [commitProject, selectedIds],
  );

  const handlePointerDown = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(event.pointerId);
      const world = applySnap(toWorldPoint(event));
      const panMode = activeTool === TOOL_IDS.HAND || isSpacePanning || event.button === 1;
      const layerLocked = activeLayer?.locked;

      if (activeTool === TOOL_IDS.IMAGE) {
        pendingImagePositionRef.current = world;
        fileInputRef.current?.click();
        return;
      }

      if (panMode) {
        interactionRef.current = {
          type: 'pan',
          startClient: { x: event.clientX, y: event.clientY },
          origin: { ...viewport },
        };
        return;
      }

      setStatus((current) => ({ ...current, mouse: { x: Math.round(world.x), y: Math.round(world.y) } }));

      if (activeTool === TOOL_IDS.TEXT) {
        setTextEditor({
          id: createId('text'),
          x: world.x,
          y: world.y,
          value: '',
          width: 260,
        });
        return;
      }

      if (activeTool === TOOL_IDS.SELECT) {
        const handlePadding = 12 / viewport.zoom;
        const selectedHandleTarget = [...selectedObjects]
          .reverse()
          .map((object) => ({
            object,
            handle: getHandleAtPoint(getObjectBounds(object), world, handlePadding),
          }))
          .find((entry) => entry.handle);

        if (selectedHandleTarget) {
          history.pushHistory(cloneSnapshot(project));
          interactionRef.current = {
            type: 'resize',
            objectId: selectedHandleTarget.object.id,
            handle: selectedHandleTarget.handle,
            start: world,
            originalObject: cloneSnapshot({ objects: [selectedHandleTarget.object] }).objects[0],
            selection: [selectedHandleTarget.object],
          };
          return;
        }

        const hit = [...project.objects]
          .reverse()
          .find((object) => object.visible !== false && visibleLayerIds.has(object.layerId) && hitTestObject(object, world));
        if (hit) {
          history.pushHistory(cloneSnapshot(project));
          const bounds = getObjectBounds(hit);
          const handle = getHandleAtPoint(bounds, world, handlePadding);
          const selectionIds = event.shiftKey ? [...new Set([...selectedIds, hit.id])] : [hit.id];
          setSelectedIds(selectionIds);
          interactionRef.current = {
            type: handle ? 'resize' : 'move',
            objectId: hit.id,
            handle,
            start: world,
            originalObject: cloneSnapshot({ objects: [hit] }).objects[0],
            selection: project.objects.filter((object) => selectionIds.includes(object.id)),
          };
          return;
        }

        setSelectedIds([]);
        interactionRef.current = {
          type: 'marquee',
          start: world,
          current: world,
        };
        return;
      }

      if (layerLocked) {
        showToast('This layer is locked', 'error');
        return;
      }

      if (activeTool === TOOL_IDS.ERASER) {
        const hitIds = project.objects
          .filter((object) => visibleLayerIds.has(object.layerId) && canEraseObject(object))
          .filter((object) => hitTestObject(object, world))
          .map((object) => object.id);

        interactionRef.current = {
          type: 'erase-objects',
          erasedIds: hitIds,
        };

        if (hitIds.length) {
          history.pushHistory(cloneSnapshot(project));
          setProject((current) => ({
            ...current,
            objects: current.objects.filter((object) => !hitIds.includes(object.id)),
          }));
          setSelectedIds((current) => current.filter((id) => !hitIds.includes(id)));
        }
        return;
      }

      if ([TOOL_IDS.PENCIL, TOOL_IDS.PEN, TOOL_IDS.HIGHLIGHTER].includes(activeTool)) {
        const isHighlighter = activeTool === TOOL_IDS.HIGHLIGHTER;
        const strokeWidth = activeTool === TOOL_IDS.PEN ? toolOptions.strokeWidth + 2 : toolOptions.strokeWidth;
        const opacity = isHighlighter ? 0.25 : toolOptions.opacity;
        const base = {
          id: createId(activeTool),
          type: 'freehand',
          points: [world],
          strokeColor: toolOptions.strokeColor,
          fillColor: 'transparent',
          strokeWidth: strokeWidth * (event.pressure && event.pressure > 0 ? 0.75 + event.pressure : 1),
          opacity,
          dashed: false,
          rotation: 0,
          layerId: activeLayerId,
          locked: false,
          visible: true,
        };
        setDraftObject(base);
        interactionRef.current = {
          type: 'draw-freehand',
          object: base,
        };
        return;
      }

      if (
        [
          TOOL_IDS.LINE,
          TOOL_IDS.ARROW,
          TOOL_IDS.RECT,
          TOOL_IDS.FILLED_RECT,
          TOOL_IDS.ELLIPSE,
          TOOL_IDS.FILLED_ELLIPSE,
          TOOL_IDS.TRIANGLE,
        ].includes(activeTool)
      ) {
        const shape = buildShapeObject(activeTool, world, world, toolOptions, activeLayerId, event.shiftKey);
        setDraftObject(shape);
        interactionRef.current = {
          type: 'draw-shape',
          start: world,
        };
      }
    },
    [
      activeLayer,
      activeLayerId,
      activeTool,
      applySnap,
      isSpacePanning,
      project.objects,
      selectedIds,
      showToast,
      toWorldPoint,
      toolOptions,
      history,
      project,
      viewport.zoom,
      visibleLayerIds,
    ],
  );

  const handlePointerMove = useCallback(
    (event) => {
      const interaction = interactionRef.current;
      const world = applySnap(toWorldPoint(event));
      setStatus((current) => ({ ...current, mouse: { x: Math.round(world.x), y: Math.round(world.y) } }));
      if (!interaction) return;

      if (interaction.type === 'pan') {
        setViewport((current) => ({
          ...current,
          offsetX: interaction.origin.offsetX + (event.clientX - interaction.startClient.x),
          offsetY: interaction.origin.offsetY + (event.clientY - interaction.startClient.y),
        }));
        return;
      }

      if (interaction.type === 'draw-freehand') {
        setDraftObject((current) => ({
          ...current,
          points: [...current.points, world],
        }));
        return;
      }

      if (interaction.type === 'erase-objects') {
        const hitIds = project.objects
          .filter((object) => visibleLayerIds.has(object.layerId) && canEraseObject(object))
          .filter((object) => !interaction.erasedIds.includes(object.id) && hitTestObject(object, world))
          .map((object) => object.id);

        if (!hitIds.length) return;

        interactionRef.current = {
          ...interaction,
          erasedIds: [...interaction.erasedIds, ...hitIds],
        };

        setProject((current) => ({
          ...current,
          objects: current.objects.filter((object) => !hitIds.includes(object.id)),
        }));
        setSelectedIds((current) => current.filter((id) => !hitIds.includes(id)));
        return;
      }

      if (interaction.type === 'draw-shape') {
        setDraftObject(buildShapeObject(activeTool, interaction.start, world, toolOptions, activeLayerId, event.shiftKey));
        return;
      }

      if (interaction.type === 'move') {
        const deltaX = world.x - interaction.start.x;
        const deltaY = world.y - interaction.start.y;
        setProject((current) => ({
          ...current,
          objects: current.objects.map((object) => {
            if (!selectedIds.includes(object.id)) return object;
            if (object.type === 'line' || object.type === 'arrow') {
              return {
                ...object,
                x1: interaction.selection.find((item) => item.id === object.id).x1 + deltaX,
                y1: interaction.selection.find((item) => item.id === object.id).y1 + deltaY,
                x2: interaction.selection.find((item) => item.id === object.id).x2 + deltaX,
                y2: interaction.selection.find((item) => item.id === object.id).y2 + deltaY,
              };
            }
            if (object.type === 'freehand' || object.type === 'eraser') {
              const original = interaction.selection.find((item) => item.id === object.id);
              return {
                ...object,
                points: original.points.map((point) => ({ x: point.x + deltaX, y: point.y + deltaY })),
              };
            }
            return {
              ...object,
              x: interaction.selection.find((item) => item.id === object.id).x + deltaX,
              y: interaction.selection.find((item) => item.id === object.id).y + deltaY,
            };
          }),
        }));
        return;
      }

      if (interaction.type === 'resize') {
        setProject((current) => ({
          ...current,
          objects: current.objects.map((object) => {
            if (object.id !== interaction.objectId) return object;
            const original = interaction.originalObject;
            const bounds = getObjectBounds(original);
            const anchor = {
              x: interaction.handle.includes('w') ? bounds.x + bounds.width : bounds.x,
              y: interaction.handle.includes('n') ? bounds.y + bounds.height : bounds.y,
            };
            const rect = resizeFromHandle(
              original,
              interaction.handle,
              anchor,
              world,
              event.shiftKey || object.type === 'image',
            );
            if (object.type === 'image' || object.type === 'rect' || object.type === 'filled-rect' || object.type === 'ellipse' || object.type === 'filled-ellipse' || object.type === 'triangle' || object.type === 'text') {
              return { ...object, ...rect };
            }
            return object;
          }),
        }));
        return;
      }

      if (interaction.type === 'marquee') {
        interactionRef.current = { ...interaction, current: world };
        const rect = normalizeRect(interaction.start.x, interaction.start.y, world.x, world.y);
        const hits = project.objects
          .filter((object) => visibleLayerIds.has(object.layerId))
          .filter((object) => {
            const bounds = getObjectBounds(object);
            return pointInRect({ x: bounds.x, y: bounds.y }, rect) && pointInRect({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, rect);
          })
          .map((object) => object.id);
        setSelectedIds(hits);
      }
    },
    [activeLayerId, activeTool, applySnap, project.objects, selectedIds, selectedObjects, toWorldPoint, toolOptions, visibleLayerIds, history, project],
  );

  const handlePointerUp = useCallback(() => {
    const interaction = interactionRef.current;
    if (!interaction) return;

    if (interaction.type === 'draw-freehand' && draftObject) {
      commitProject((current) => ({ ...current, objects: [...current.objects, draftObject] }));
      setDraftObject(null);
    } else if (interaction.type === 'draw-shape' && draftObject) {
      commitProject((current) => ({ ...current, objects: [...current.objects, draftObject] }));
      setSelectedIds([draftObject.id]);
      setDraftObject(null);
    }

    interactionRef.current = null;
  }, [commitProject, draftObject]);

  const handleWheel = useCallback(
    (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1.08 : 0.92;
      const nextZoom = clamp(viewport.zoom * delta, 0.25, 4);
      const world = toWorldPoint(event);
      setViewport((current) => ({
        zoom: nextZoom,
        offsetX: event.clientX - world.x * nextZoom,
        offsetY: event.clientY - world.y * nextZoom,
      }));
    },
    [toWorldPoint, viewport.zoom],
  );

  const zoomBy = useCallback((factor) => {
    setViewport((current) => ({ ...current, zoom: clamp(current.zoom * factor, 0.25, 4) }));
  }, []);

  const resetView = useCallback(() => {
    setViewport({ zoom: 1, offsetX: 0, offsetY: 0 });
  }, []);

  const toggleGrid = useCallback(() => {
    setProject((current) => ({ ...current, gridEnabled: !current.gridEnabled }));
  }, []);

  const toggleSnap = useCallback(() => {
    setProject((current) => ({ ...current, snapToGrid: !current.snapToGrid }));
  }, []);

  const toggleBlackboard = useCallback(() => {
    const next = toolOptions.background === BLACKBOARD_BACKGROUND ? DEFAULT_BACKGROUND : BLACKBOARD_BACKGROUND;
    updateToolOption('background', next);
    setProject((current) => ({ ...current, blackboardMode: next === BLACKBOARD_BACKGROUND, background: next }));
  }, [toolOptions.background, updateToolOption]);

  const handleTextSubmit = useCallback(
    (value) => {
      if (!textEditor) return;
      const trimmed = value.trim();
      setTextEditor(null);
      if (!trimmed) return;
      const nextObject = {
        id: textEditor.id,
        type: 'text',
        x: textEditor.x,
        y: textEditor.y,
        text: trimmed,
        strokeColor: toolOptions.strokeColor,
        fillColor: 'transparent',
        boxStrokeColor: null,
        strokeWidth: 1,
        opacity: toolOptions.opacity,
        rotation: 0,
        layerId: activeLayerId,
        locked: false,
        visible: true,
        fontSize: toolOptions.fontSize,
        ...buildTextboxMetrics(trimmed, toolOptions.fontSize),
        bold: toolOptions.bold,
        italic: toolOptions.italic,
      };
      commitProject((current) => ({ ...current, objects: [...current.objects, nextObject] }));
      setSelectedIds([nextObject.id]);
      setActiveTool(TOOL_IDS.SELECT);
      setStatus((current) => ({ ...current, toolName: TOOL_IDS.SELECT }));
    },
    [activeLayerId, commitProject, textEditor, toolOptions],
  );

  const handleImageUpload = useCallback(
    async (file) => {
      if (!file) return;
      try {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
          const maxWidth = 480;
          const maxHeight = 360;
          const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
          const width = Math.max(48, Math.round(image.width * scale));
          const height = Math.max(48, Math.round(image.height * scale));
          const origin = pendingImagePositionRef.current;
          const imageId = createId('image');

          const nextObject = {
            id: imageId,
            type: 'image',
            x: origin.x - width / 2,
            y: origin.y - height / 2,
            width,
            height,
            src: objectUrl,
            imageElement: image,
            strokeColor: '#000000',
            fillColor: 'transparent',
            strokeWidth: 0,
            opacity: 1,
            rotation: 0,
            layerId: activeLayerId,
            locked: false,
            visible: true,
          };
          commitProject((current) => ({ ...current, objects: [...current.objects, nextObject] }));
          setSelectedIds([nextObject.id]);
          setActiveTool(TOOL_IDS.SELECT);
          setStatus((current) => ({ ...current, toolName: TOOL_IDS.SELECT }));
          showToast('Image added');

          readFileAsDataUrl(file)
            .then((dataUrl) => {
              setProject((current) => ({
                ...current,
                objects: current.objects.map((object) => (object.id === imageId ? { ...object, src: dataUrl } : object)),
              }));
            })
            .catch((error) => {
              console.error(error);
            })
            .finally(() => {
              URL.revokeObjectURL(objectUrl);
            });
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          showToast('Unable to load image', 'error');
        };
        image.src = objectUrl;
      } catch (error) {
        console.error(error);
        showToast('Image upload failed', 'error');
      }
    },
    [activeLayerId, commitProject, showToast],
  );

  const exportAs = useCallback(
    async (type) => {
      if (type === 'svg') {
        const svg = exportProjectSvg(project, canvasSize.width || 1600, canvasSize.height || 900, toolOptions.background);
        downloadTextFile('prodraw-board.svg', svg, 'image/svg+xml');
      } else if (type === 'json') {
        downloadTextFile('prodraw-board.json', JSON.stringify(projectToSerializable(project), null, 2));
      } else if (type === 'clipboard') {
        try {
          await copyCanvasToClipboard(project, canvasSize.width || 1600, canvasSize.height || 900, toolOptions.background);
        } catch (error) {
          showToast('Clipboard copy failed', 'error');
          return;
        }
      } else {
        const dataUrl = exportCanvasImage(project, canvasSize.width || 1600, canvasSize.height || 900, toolOptions.background, type);
        downloadDataUrl(`prodraw-board.${type === 'jpeg' ? 'jpg' : 'png'}`, dataUrl);
      }
      showToast(`Exported ${type.toUpperCase() === 'JSON' ? 'project JSON' : type.toUpperCase()}`);
    },
    [canvasSize.height, canvasSize.width, project, showToast, toolOptions.background],
  );

  const loadProjectFromFile = useCallback(
    async (file) => {
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        await bringProjectState(parsed);
        showToast('Project loaded');
      } catch (error) {
        console.error(error);
        showToast('Unable to load project file', 'error');
      }
    },
    [bringProjectState, showToast],
  );

  const groupSelected = useCallback(() => {
    const groupId = createId('group');
    updateSelectionObjects((object) => ({ ...object, groupId }));
  }, [updateSelectionObjects]);

  const ungroupSelected = useCallback(() => {
    updateSelectionObjects((object) => ({ ...object, groupId: null }));
  }, [updateSelectionObjects]);

  const canvasCursor = getCursorForTool(activeTool, interactionRef.current?.type === 'pan');

  return {
    canvasRef,
    fileInputRef,
    project,
    setProject,
    activeTool,
    setTool,
    toolOptions,
    updateToolOption,
    viewport,
    status: {
      ...status,
      toolName: activeTool,
      zoomPercent: Math.round(viewport.zoom * 100),
    },
    selectedIds,
    selectedObjects,
    activeLayerId,
    setActiveLayerId,
    activeLayer,
    toast,
    textEditor,
    canvasSize,
    isSidebarOpen,
    setIsSidebarOpen,
    canvasCursor,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleUndo,
    handleRedo,
    saveProject,
    clearCanvas,
    deleteSelection,
    cancelCurrentAction,
    zoomBy,
    resetView,
    toggleGrid,
    toggleSnap,
    toggleBlackboard,
    handleTextSubmit,
    handleImageUpload,
    exportAs,
    loadProjectFromFile,
    setIsSpacePanning,
    addLayer,
    updateLayer,
    deleteLayer,
    setObjectOrder,
    duplicateSelection,
    groupSelected,
    ungroupSelected,
  };
}
