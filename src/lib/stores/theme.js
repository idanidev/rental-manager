import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const defaultTheme = browser 
  ? localStorage.getItem('theme') || 'light'
  : 'light';

function createThemeStore() {
  const { subscribe, set, update } = writable(defaultTheme);

  return {
    subscribe,
    toggle: () => update(theme => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      if (browser) {
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      return newTheme;
    }),
    set: (theme) => {
      if (browser) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
      set(theme);
    }
  };
}

export const theme = createThemeStore();

// Aplicar tema inicial
if (browser) {
  document.documentElement.setAttribute('data-theme', defaultTheme);
}

