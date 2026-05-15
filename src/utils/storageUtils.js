const PROJECT_KEY = 'prodraw-project-v1';

export function saveProjectToStorage(project) {
  localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
}

export function loadProjectFromStorage() {
  const raw = localStorage.getItem(PROJECT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse saved project', error);
    return null;
  }
}

export function downloadTextFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
