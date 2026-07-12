import { useCallback, useSyncExternalStore } from "react";
import { authStore } from "../../lib/authStore";
import { loginRequest, logoutRequest, signupRequest, type SignupInput } from "../../api/auth";

export function useAuth() {
  const state = useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    authStore.setSession(result.user, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return result.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const result = await signupRequest(input);
    authStore.setSession(result.user, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = authStore.getState();
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined);
    }
    authStore.clear();
  }, []);

  return {
    user: state.user,
    isAuthenticated: Boolean(state.user && state.accessToken),
    login,
    signup,
    logout,
  };
}
