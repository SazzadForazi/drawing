import { useCallback, useRef, useState } from 'react';

export function useHistory(limit = 50) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const sync = useCallback(() => {
    setHistoryState({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    });
  }, []);

  const pushHistory = useCallback(
    (snapshot) => {
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > limit) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      sync();
    },
    [limit, sync],
  );

  const undo = useCallback(
    (currentSnapshot) => {
      const previous = undoStackRef.current.pop();
      if (!previous) return null;
      redoStackRef.current.push(currentSnapshot);
      sync();
      return previous;
    },
    [sync],
  );

  const redo = useCallback(
    (currentSnapshot) => {
      const next = redoStackRef.current.pop();
      if (!next) return null;
      undoStackRef.current.push(currentSnapshot);
      sync();
      return next;
    },
    [sync],
  );

  const clear = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    sync();
  }, [sync]);

  return {
    ...historyState,
    pushHistory,
    undo,
    redo,
    clear,
  };
}
