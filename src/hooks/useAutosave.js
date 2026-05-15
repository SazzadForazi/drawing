import { useEffect } from 'react';
import { saveProjectToStorage } from '../utils/storageUtils';

export function useAutosave(project, delay = 800) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      saveProjectToStorage(project);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, project]);
}
