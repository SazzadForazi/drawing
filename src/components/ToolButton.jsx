export default function ToolButton({ icon: Icon, label, shortcut, active, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
        active
          ? 'border-white/15 bg-emerald-500/20 text-emerald-100 shadow-lg shadow-emerald-500/20'
          : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800'
      }`}
    >
      <Icon className="h-5 w-5" />
      {badge ? (
        <span className="absolute -right-1 -top-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-100">
          {badge}
        </span>
      ) : null}
      <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-slate-100 shadow-glass group-hover:block">
        {label}
      </span>
    </button>
  );
}
