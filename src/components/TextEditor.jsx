import { useEffect, useRef, useState } from 'react';

export default function TextEditor({ draft, viewport, onSubmit, onCancel }) {
  const [value, setValue] = useState(draft?.value || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  if (!draft) return null;

  return (
    <div
      className="absolute z-40"
      style={{
        left: draft.x * viewport.zoom + viewport.offsetX,
        top: draft.y * viewport.zoom + viewport.offsetY,
        width: draft.width,
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => onSubmit(value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onCancel();
          }
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            onSubmit(value);
          }
        }}
        placeholder="Write note..."
        className="block min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-transparent p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
      />
    </div>
  );
}
