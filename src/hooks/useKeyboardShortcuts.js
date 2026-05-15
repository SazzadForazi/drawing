import { useEffect } from 'react';
import { TOOL_IDS } from '../constants/tools';

export function useKeyboardShortcuts({
  onToolChange,
  onUndo,
  onRedo,
  onSave,
  onDelete,
  onEscape,
  onPanStart,
  onPanEnd,
}) {
  useEffect(() => {
    function isTypingTarget(target) {
      if (!(target instanceof HTMLElement)) return false;
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    }

    function handleKeyDown(event) {
      const key = event.key.toLowerCase();
      const isMeta = event.ctrlKey || event.metaKey;
      const typing = isTypingTarget(event.target);

      if (isMeta && key === 'z') {
        event.preventDefault();
        onUndo();
        return;
      }

      if (isMeta && key === 'y') {
        event.preventDefault();
        onRedo();
        return;
      }

      if (isMeta && key === 's') {
        event.preventDefault();
        onSave();
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        if (typing) return;
        onDelete();
        return;
      }

      if (key === 'escape') {
        onEscape();
        return;
      }

      if (typing) {
        return;
      }

      if (key === ' ') {
        event.preventDefault();
        onPanStart();
        return;
      }

      const toolMap = {
        v: TOOL_IDS.SELECT,
        p: TOOL_IDS.PENCIL,
        e: TOOL_IDS.ERASER,
        t: TOOL_IDS.TEXT,
        r: TOOL_IDS.RECT,
        c: TOOL_IDS.ELLIPSE,
        l: TOOL_IDS.LINE,
        a: TOOL_IDS.ARROW,
      };

      if (!isMeta && toolMap[key]) {
        onToolChange(toolMap[key]);
      }
    }

    function handleKeyUp(event) {
      if (isTypingTarget(event.target)) return;
      if (event.key === ' ') {
        onPanEnd();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onDelete, onEscape, onPanEnd, onPanStart, onRedo, onSave, onToolChange, onUndo]);
}
