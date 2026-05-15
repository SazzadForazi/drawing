import { useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eraser,
  FolderOpen,
  Forward,
  ImagePlus,
  Layers,
  MoveDown,
  MoveUp,
  RefreshCcw,
  Settings2,
  Shapes,
  Trash,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import BrushPanel from './components/BrushPanel';
import ColorPanel from './components/ColorPanel';
import LayersPanel from './components/LayersPanel';
import StatusBar from './components/StatusBar';
import TextEditor from './components/TextEditor';
import Toolbar from './components/Toolbar';
import TopBar from './components/TopBar';
import { useAutosave } from './hooks/useAutosave';
import { useCanvasEngine } from './hooks/useCanvasEngine';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import coverImage from './img/cover.jpeg';
import { projectToSerializable } from './utils/canvasUtils';

const APP_NAME = 'ProDraw Board';
const APP_BADGE = 'PRODRAW';
const APP_COVER_ALT = 'ProDraw Board cover';

export default function App() {
  const jsonInputRef = useRef(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false);
  const {
    canvasRef,
    fileInputRef,
    project,
    activeTool,
    setTool,
    toolOptions,
    updateToolOption,
    viewport,
    status,
    selectedIds,
    activeLayerId,
    setActiveLayerId,
    toast,
    textEditor,
    canvasSize,
    isSidebarOpen,
    setIsSidebarOpen,
    canvasCursor,
    canUndo,
    canRedo,
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
  } = useCanvasEngine();

  const serializableProject = useMemo(() => projectToSerializable(project), [project]);

  useAutosave(serializableProject);

  useKeyboardShortcuts({
    onToolChange: setTool,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: saveProject,
    onDelete: deleteSelection,
    onEscape: cancelCurrentAction,
    onPanStart: () => setIsSpacePanning(true),
    onPanEnd: () => setIsSpacePanning(false),
  });

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(248,113,113,0.12),_transparent_20%),linear-gradient(180deg,_#09120f,_#0f1e19_42%,_#132720)] font-body text-slate-800">
      <Toolbar
        activeTool={activeTool}
        onToolChange={(tool) => {
          setTool(tool);
          setIsSidebarOpen(false);
        }}
        onAction={(action) => {
          if (action === 'undo') handleUndo();
          if (action === 'redo') handleRedo();
          if (action === 'clear') clearCanvas();
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        mobileOpen={isSidebarOpen}
        onToggleMobile={() => setIsSidebarOpen((current) => !current)}
      />

      <TopBar
        toolOptions={toolOptions}
        onOptionChange={updateToolOption}
        onSave={saveProject}
        onClear={clearCanvas}
        onExport={exportAs}
        onLoadJson={() => jsonInputRef.current?.click()}
        onToggleGrid={toggleGrid}
        onToggleSnap={toggleSnap}
        onToggleBlackboard={toggleBlackboard}
        project={project}
      />

      <main className="flex h-full w-full pt-[76px]">
        <section className="relative flex-1">
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none"
            style={{ cursor: canvasCursor }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          />

          {!project.objects.length ? (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 px-4">
              <div className="pointer-events-auto rounded-[1.75rem] border border-white/10 bg-slate-950/58 p-5 shadow-glass backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-glass">
                    <img src={coverImage} alt={APP_COVER_ALT} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center rounded-full border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(16,185,129,0.12))] px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.32em] text-transparent shadow-[0_0_24px_rgba(16,185,129,0.12)] bg-clip-text [background-image:linear-gradient(135deg,#f8fafc_10%,#99f6e4_55%,#34d399_100%)]">
                      {APP_BADGE}
                    </div>
                    <h1 className="mt-2 font-display text-xl font-semibold uppercase tracking-[0.12em] text-slate-50">{APP_NAME}</h1>
                    <p className="mt-1 max-w-md text-sm leading-6 text-slate-300">
                      Start with a screenshot, sketch an idea, or load an existing board.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Add Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => jsonInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.1]"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Load Board
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">P Pencil</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">R Rectangle</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">T Text</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">I Image</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">Ctrl+Wheel Zoom</span>
                </div>
              </div>
            </div>
          ) : null}

          <TextEditor draft={textEditor} viewport={viewport} onSubmit={handleTextSubmit} onCancel={cancelCurrentAction} />

          <div className="pointer-events-none absolute bottom-20 left-28 z-30 max-w-[calc(100vw-8rem)]">
            <div className="pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsToolPanelOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm font-semibold text-slate-100 shadow-glass backdrop-blur transition hover:bg-slate-900"
              >
                <Settings2 className="h-4 w-4" />
                Tool Settings
                {isToolPanelOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {isToolPanelOpen ? (
                <div className="mt-3 w-[296px] max-w-[calc(100vw-8rem)] rounded-3xl border border-white/10 bg-slate-950/82 p-3 shadow-glass backdrop-blur">
                  <BrushPanel toolOptions={toolOptions} onOptionChange={updateToolOption} />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside
          className={`hidden shrink-0 border-l border-white/10 bg-slate-950/30 backdrop-blur transition-all duration-300 xl:flex xl:flex-col ${
            isInspectorOpen ? 'w-[328px] p-4' : 'w-[72px] p-3'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsInspectorOpen((current) => !current)}
            className="mb-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
            title={isInspectorOpen ? 'Collapse right panel' : 'Open right panel'}
          >
            {isInspectorOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {isInspectorOpen ? <span>Hide Panel</span> : <Settings2 className="h-4 w-4" />}
          </button>

          {isInspectorOpen ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
              <ColorPanel toolOptions={toolOptions} recentColors={project.recentColors} onOptionChange={updateToolOption} />
              <MarketHints />
              <QuickActions
                hasSelection={hasSelection}
                onDelete={deleteSelection}
                onDuplicate={duplicateSelection}
                onFront={() => setObjectOrder('front')}
                onForward={() => setObjectOrder('forward')}
                onBackward={() => setObjectOrder('backward')}
                onBack={() => setObjectOrder('back')}
                onGroup={groupSelected}
                onUngroup={ungroupSelected}
                onZoomIn={() => zoomBy(1.1)}
                onZoomOut={() => zoomBy(0.9)}
                onExport={exportAs}
              />
              <LayersPanel
                layers={project.layers}
                activeLayerId={activeLayerId}
                onSelect={setActiveLayerId}
                onAdd={addLayer}
                onUpdate={updateLayer}
                onDelete={deleteLayer}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center gap-3 pt-2">
              <MiniDockLabel icon={Settings2} label="Inspect" />
              <MiniDockLabel icon={Layers} label="Layers" />
              <MiniDockLabel icon={Shapes} label="Export" />
            </div>
          )}
        </aside>
      </main>

      <StatusBar status={status} canvasSize={canvasSize} />

      <div className="pointer-events-none absolute right-4 top-24 z-30 space-y-3 xl:hidden">
        <div className="pointer-events-auto">
          <ColorPanel toolOptions={toolOptions} recentColors={project.recentColors} onOptionChange={updateToolOption} />
        </div>
      </div>

      {toast ? (
        <div className={`absolute right-4 top-24 z-40 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-glass ${toast.tone === 'error' ? 'bg-rose-500' : 'bg-slate-900/95'}`}>
          {toast.message}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleImageUpload(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => loadProjectFromFile(event.target.files?.[0])}
      />
    </div>
  );
}

function MiniDockLabel({ icon: Icon, label }) {
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
      <Icon className="h-4 w-4 text-slate-200" />
      <span className="[writing-mode:vertical-rl] rotate-180">{label}</span>
    </div>
  );
}

function MarketHints() {
  const hints = [
    { name: 'Bull path', color: 'bg-emerald-400', text: 'Use a green arrow or line to show the expected continuation path.' },
    { name: 'Bear invalidation', color: 'bg-rose-400', text: 'Use a red line to mark invalidation, rejection, or a failed swing.' },
    { name: 'POI zone', color: 'bg-yellow-400', text: 'Use a filled rectangle to mark supply, demand, or reaction zones.' },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/72 p-4 shadow-glass backdrop-blur">
      <div className="mb-3 text-sm font-semibold text-slate-100">Market Markup Flow</div>
      <div className="space-y-3">
        {hints.map((hint) => (
          <div key={hint.name} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-100">
              <span className={`h-2.5 w-2.5 rounded-full ${hint.color}`} />
              {hint.name}
            </div>
            <p className="text-xs leading-5 text-slate-400">{hint.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions({
  hasSelection,
  onDelete,
  onDuplicate,
  onFront,
  onForward,
  onBackward,
  onBack,
  onGroup,
  onUngroup,
  onZoomIn,
  onZoomOut,
  onExport,
}) {
  const actions = [
    { icon: Trash, label: 'Delete', onClick: onDelete, disabled: !hasSelection },
    { icon: Copy, label: 'Duplicate', onClick: onDuplicate, disabled: !hasSelection },
    { icon: MoveUp, label: 'To Front', onClick: onFront, disabled: !hasSelection },
    { icon: Forward, label: 'Forward', onClick: onForward, disabled: !hasSelection },
    { icon: MoveDown, label: 'Backward', onClick: onBackward, disabled: !hasSelection },
    { icon: RefreshCcw, label: 'To Back', onClick: onBack, disabled: !hasSelection },
    { icon: Layers, label: 'Group', onClick: onGroup, disabled: !hasSelection },
    { icon: Layers, label: 'Ungroup', onClick: onUngroup, disabled: !hasSelection },
    { icon: ZoomIn, label: 'Zoom In', onClick: onZoomIn },
    { icon: ZoomOut, label: 'Zoom Out', onClick: onZoomOut },
    { icon: Download, label: 'PNG', onClick: () => onExport('png') },
    { icon: Shapes, label: 'SVG', onClick: () => onExport('svg') },
    { icon: Eraser, label: 'JPEG', onClick: () => onExport('jpeg') },
    { icon: Copy, label: 'JSON', onClick: () => onExport('json') },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/72 p-4 shadow-glass backdrop-blur">
      <div className="mb-3 text-sm font-semibold text-slate-100">Trading Actions</div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
