import { Eye, EyeOff, Lock, LockOpen, Plus, Trash2 } from 'lucide-react';

export default function LayersPanel({
  layers,
  activeLayerId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/72 p-4 shadow-glass backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-100">Layers</span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`rounded-2xl border px-3 py-2 ${activeLayerId === layer.id ? 'border-white/15 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}
          >
            <div className="mb-2 w-full text-left text-sm font-medium text-slate-100">
              <input
                value={layer.name}
                onChange={(event) => onUpdate(layer.id, { name: event.target.value })}
                onFocus={() => onSelect(layer.id)}
                className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-slate-100 outline-none focus:border-white/15 focus:bg-white/[0.05]"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => onUpdate(layer.id, { visible: !layer.visible })} className="rounded-xl bg-white/[0.06] p-2 text-slate-300">
                {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => onUpdate(layer.id, { locked: !layer.locked })} className="rounded-xl bg-white/[0.06] p-2 text-slate-300">
                {layer.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => onDelete(layer.id)} className="rounded-xl bg-white/[0.06] p-2 text-rose-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
