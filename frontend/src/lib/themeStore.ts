type Theme = "light" | "dark";

const STORAGE_KEY = "assetflow.theme";

function getSystemPreference(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function loadInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return getSystemPreference();
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

let theme: Theme = loadInitialTheme();
applyTheme(theme);

const listeners = new Set<() => void>();

export const themeStore = {
  getState(): Theme {
    return theme;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  toggle() {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    listeners.forEach((listener) => listener());
  },
};
