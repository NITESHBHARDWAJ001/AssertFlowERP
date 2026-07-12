// Minimal ambient types for the subset of Puter.js (window.puter) this app
// actually uses. Puter.js attaches itself to `window` from the CDN script in
// index.html - see https://developer.puter.com/tutorials/ for the full API.
export interface PuterChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface PuterChatResponse {
  message: { content: string };
}

export interface PuterStreamPart {
  text?: string;
}

export interface PuterUser {
  username: string;
  email?: string;
}

export interface PuterGlobal {
  auth: {
    isSignedIn(): boolean;
    signIn(): Promise<unknown>;
    signOut(): void;
    getUser(): Promise<PuterUser>;
  };
  ai: {
    chat(
      messages: PuterChatMessage[],
      options?: { model?: string; stream?: boolean; temperature?: number }
    ): Promise<PuterChatResponse | AsyncIterable<PuterStreamPart>>;
  };
}

declare global {
  interface Window {
    puter?: PuterGlobal;
  }
}
