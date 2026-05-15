export default function BrushPanel({ toolOptions, onOptionChange }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/72 p-4 shadow-glass backdrop-blur">
      <div className="mb-3 text-sm font-semibold text-slate-100">Brush & Shape</div>
      <div className="space-y-3 text-sm text-slate-300">
        <label className="flex flex-col gap-1">
          Size
          <input
            type="range"
            min="1"
            max="48"
            value={toolOptions.strokeWidth}
            onChange={(event) => onOptionChange('strokeWidth', Number(event.target.value))}
            className="accent-orange-500"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Dashed</span>
          <input
            type="checkbox"
            checked={toolOptions.dashed}
            onChange={(event) => onOptionChange('dashed', event.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Fill shapes</span>
          <input
            type="checkbox"
            checked={toolOptions.fillEnabled}
            onChange={(event) => onOptionChange('fillEnabled', event.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          Font size
          <input
            type="range"
            min="12"
            max="72"
            value={toolOptions.fontSize}
            onChange={(event) => onOptionChange('fontSize', Number(event.target.value))}
            className="accent-orange-500"
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOptionChange('bold', !toolOptions.bold)}
            className={`rounded-xl px-3 py-2 font-semibold ${toolOptions.bold ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-slate-300'}`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => onOptionChange('italic', !toolOptions.italic)}
            className={`rounded-xl px-3 py-2 italic ${toolOptions.italic ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-slate-300'}`}
          >
            I
          </button>
        </div>
      </div>
    </div>
  );
}
