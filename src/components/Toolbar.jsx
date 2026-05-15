import { Menu } from 'lucide-react';
import { ACTION_BUTTONS, TOOL_IDS, TOOL_LIST } from '../constants/tools';
import coverImage from '../img/cover.jpeg';
import ToolButton from './ToolButton';

const APP_SHORT_NAME = 'ProDraw';
const APP_COVER_ALT = 'ProDraw Board cover';

export default function Toolbar({
  activeTool,
  onToolChange,
  onAction,
  canUndo,
  canRedo,
  mobileOpen,
  onToggleMobile,
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggleMobile}
        className="absolute left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/90 text-slate-100 shadow-glass md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={`absolute left-0 top-0 z-30 flex h-full w-[88px] flex-col items-center gap-3 border-r border-slate-800 bg-slate-950/96 px-3 py-5 shadow-glass transition-transform md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-2 flex flex-col items-center gap-1">
          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
            <img src={coverImage} alt={APP_COVER_ALT} className="h-full w-full object-cover" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{APP_SHORT_NAME}</span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto pb-3">
          {TOOL_LIST.map((tool) => (
            <ToolButton
              key={tool.id}
              icon={tool.icon}
              label={tool.label}
              shortcut={tool.shortcut}
              active={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-slate-800 pt-3">
          <ToolButton
            icon={ACTION_BUTTONS.undo.icon}
            label="Undo"
            active={false}
            badge={!canUndo ? 'x' : null}
            onClick={() => onAction('undo')}
          />
          <ToolButton
            icon={ACTION_BUTTONS.redo.icon}
            label="Redo"
            active={false}
            badge={!canRedo ? 'x' : null}
            onClick={() => onAction('redo')}
          />
          <ToolButton
            icon={ACTION_BUTTONS.clear.icon}
            label="Clear Canvas"
            active={activeTool === TOOL_IDS.SELECT && false}
            onClick={() => onAction('clear')}
          />
        </div>
      </aside>
    </>
  );
}
