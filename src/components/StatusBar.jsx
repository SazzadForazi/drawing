export default function StatusBar({ status, canvasSize }) {
  return (
    <footer className="absolute bottom-0 left-0 z-20 flex w-full flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950/78 px-4 py-2 pl-24 text-xs text-slate-300 shadow-sm backdrop-blur md:pl-[108px]">
      <span>Tool: {status.toolName}</span>
      <span>Zoom: {status.zoomPercent}%</span>
      <span>
        Cursor: {status.mouse.x}, {status.mouse.y}
      </span>
      <span>
        Canvas: {canvasSize.width} x {canvasSize.height}
      </span>
    </footer>
  );
}
