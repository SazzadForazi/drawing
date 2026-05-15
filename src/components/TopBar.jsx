import { Clipboard, Download, FolderOpen, Grid2X2, Layers3, Monitor, Save, Upload } from 'lucide-react';

export default function TopBar({
  toolOptions,
  onOptionChange,
  onSave,
  onClear,
  onExport,
  onLoadJson,
  onToggleGrid,
  onToggleSnap,
  onToggleBlackboard,
  project,
}) {
  return (
    <header className="absolute left-0 top-0 z-20 flex w-full items-center justify-between gap-3 border-b border-white/10 bg-slate-950/72 px-4 py-3 pl-24 shadow-sm backdrop-blur md:pl-[108px]">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            onOptionChange('strokeColor', '#ff6b6b');
            onOptionChange('fillColor', '#ff6b6b');
          }}
          className="rounded-2xl border border-white/10 bg-rose-500 px-3 py-2 text-sm font-semibold text-white"
        >
          Bear
        </button>
        <button
          type="button"
          onClick={() => {
            onOptionChange('strokeColor', '#1ecb81');
            onOptionChange('fillColor', '#1ecb81');
          }}
          className="rounded-2xl border border-white/10 bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
        >
          Bull
        </button>
        <button
          type="button"
          onClick={() => onOptionChange('strokeColor', '#f8fafc')}
          className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-50"
        >
          Chalk
        </button>
        <input
          type="color"
          value={toolOptions.strokeColor}
          onChange={(event) => onOptionChange('strokeColor', event.target.value)}
          className="h-11 w-14 rounded-2xl border border-white/10 bg-slate-900 p-1"
        />
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-300">
          Stroke
          <input
            type="range"
            min="1"
            max="48"
            value={toolOptions.strokeWidth}
            onChange={(event) => onOptionChange('strokeWidth', Number(event.target.value))}
            className="w-28 accent-emerald-500"
          />
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-300">
          Dotted
          <input
            type="checkbox"
            checked={toolOptions.dashed}
            onChange={(event) => onOptionChange('dashed', event.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-slate-900"
          />
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-300">
          Fill Zone
          <input
            type="checkbox"
            checked={toolOptions.fillEnabled}
            onChange={(event) => onOptionChange('fillEnabled', event.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-slate-900"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Action onClick={onToggleGrid} icon={Grid2X2} label={project.gridEnabled ? 'Grid On' : 'Chart Grid'} />
        <Action onClick={onToggleSnap} icon={Layers3} label={project.snapToGrid ? 'Snap On' : 'Price Snap'} />
        <Action onClick={onToggleBlackboard} icon={Monitor} label="Board Tone" />
        <Action onClick={onSave} icon={Save} label="Save" />
        <Action onClick={onClear} icon={Upload} label="Reset" />
        <Action onClick={() => onExport('png')} icon={Download} label="Export PNG" />
        <Action onClick={() => onExport('clipboard')} icon={Clipboard} label="Copy Shot" />
        <Action onClick={onLoadJson} icon={FolderOpen} label="Load Layout" />
      </div>
    </header>
  );
}

function Action({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
