import { useSyncExternalStore } from "react";
import { themeStore } from "../lib/themeStore";

export function useTheme() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.getState, themeStore.getState);
  return { theme, toggleTheme: themeStore.toggle };
}
