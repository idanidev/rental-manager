import { writable } from "svelte/store";
import { browser } from "$app/environment";

const defaultTheme = browser
  ? localStorage.getItem("theme") || "light"
  : "light";

function createThemeStore() {
  const { subscribe, set, update } = writable(defaultTheme);

  return {
    subscribe,
    toggle: () =>
      update((theme) => {
        const newTheme = theme === "light" ? "dark" : "light";
        if (browser) {
          localStorage.setItem("theme", newTheme);
          document.documentElement.setAttribute("data-theme", newTheme);
          if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        return newTheme;
      }),
    set: (theme) => {
      if (browser) {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      set(theme);
    },
  };
}

export const theme = createThemeStore();

// Aplicar tema inicial
if (browser) {
  document.documentElement.setAttribute("data-theme", defaultTheme);
  if (defaultTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
