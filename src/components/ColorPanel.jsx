import { QUICK_COLORS } from '../constants/colors';

export default function ColorPanel({ toolOptions, recentColors = [], onOptionChange }) {
  const colors = [...QUICK_COLORS, ...recentColors.filter((color) => !QUICK_COLORS.includes(color))].slice(0, 10);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/72 p-4 shadow-glass backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-100">Markup Colors</span>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Opacity
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={toolOptions.opacity}
            onChange={(event) => onOptionChange('opacity', Number(event.target.value))}
            className="w-24 accent-orange-500"
          />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`h-8 w-8 rounded-xl border-2 ${toolOptions.strokeColor === color ? 'border-slate-900' : 'border-white/80'}`}
            style={{ backgroundColor: color }}
            onClick={() => onOptionChange('strokeColor', color)}
            title={color}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col gap-1 text-slate-300">
          Stroke
          <input
            type="color"
            value={toolOptions.strokeColor}
            onChange={(event) => onOptionChange('strokeColor', event.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-slate-300">
          Fill
          <input
            type="color"
            value={toolOptions.fillColor}
            onChange={(event) => onOptionChange('fillColor', event.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-slate-900"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-slate-300">
          Background
          <input
            type="color"
            value={toolOptions.background}
            onChange={(event) => onOptionChange('background', event.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-slate-900"
          />
        </label>
      </div>
    </div>
  );
}
