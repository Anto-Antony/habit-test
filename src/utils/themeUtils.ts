import type { Theme } from '../types/Theme';

const SETTINGS_THEME_ENDPOINT = 'https://habit-track.up.railway.app/habits';
const checkupEndpoint = 'https://habit-track.up.railway.app/health';

export async function saveThemeToStorage(theme: Theme): Promise<void> {
  try {
    // Try to save theme to remote settings endpoint
    await fetch(SETTINGS_THEME_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
  } catch (error) {
    console.error('Failed to save theme to server:', error);
  }
}

export async function loadThemeFromStorage(): Promise<Theme> {
  const check = await fetch(checkupEndpoint);
  console.log('Loading theme from server:', check);
  try {
    const res = await fetch(SETTINGS_THEME_ENDPOINT);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.theme === 'light' || data.theme === 'dark')) {
        return data.theme as Theme;
      }
    }

    // Fallback to system preference when server not available or response unexpected
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (error) {
    console.error('Failed to load theme from server:', error);
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
