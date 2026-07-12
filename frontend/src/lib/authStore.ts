import type { AuthTokens, AuthUser } from "../types/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const STORAGE_KEY = "assetflow.auth";

function loadInitialState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

let state: AuthState = loadInitialState();
const listeners = new Set<() => void>();

function persist() {
  if (state.user && state.accessToken && state.refreshToken) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getState(): AuthState {
    return state;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setSession(user: AuthUser, tokens: AuthTokens) {
    state = { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    emit();
  },
  setTokens(tokens: AuthTokens) {
    state = { ...state, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    emit();
  },
  clear() {
    state = { user: null, accessToken: null, refreshToken: null };
    emit();
  },
};
