import { useEffect, useRef, useState } from "react";
import { ASSETFLOW_SYSTEM_PROMPT } from "./systemPrompt";
import type { PuterChatMessage, PuterUser } from "../../types/puter";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

const MODEL = "x-ai/grok-4-1-fast";

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6A2.5 2.5 0 0 1 14.5 14H8l-3.8 3v-3H5.5A2.5 2.5 0 0 1 3 11.5v-6Z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className={className}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3 9.5 10.5M17 3l-5.5 14-3-6.5L2 8 17 3Z" />
    </svg>
  );
}

export function HelpChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [user, setUser] = useState<PuterUser | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const puter = window.puter;
    if (!puter) {
      setCheckingAuth(false);
      return;
    }
    setIsSignedIn(puter.auth.isSignedIn());
    setCheckingAuth(false);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleSignIn = async () => {
    const puter = window.puter;
    if (!puter) {
      setError("The assistant is still loading. Try again in a moment.");
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      await puter.auth.signIn();
      setIsSignedIn(true);
      const currentUser = await puter.auth.getUser().catch(() => null);
      setUser(currentUser);
    } catch {
      setError("Sign-in was cancelled or failed. Try again when you're ready.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleSend = async () => {
    const puter = window.puter;
    const text = input.trim();
    if (!text || !puter || isSending) return;

    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setError(null);

    const conversation: PuterChatMessage[] = [
      { role: "system", content: ASSETFLOW_SYSTEM_PROMPT },
      ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const response = await puter.ai.chat(conversation, { model: MODEL, stream: true });

      if (Symbol.asyncIterator in Object(response)) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        for await (const part of response as AsyncIterable<{ text?: string }>) {
          if (!part.text) continue;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + part.text };
            return updated;
          });
        }
      } else {
        const content = (response as { message: { content: string } }).message.content;
        setMessages((prev) => [...prev, { role: "assistant", content }]);
      }
    } catch {
      setError("Couldn't reach the assistant. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:right-6">
          <div className="flex items-center justify-between border-b border-slate-200 bg-brand-600 px-4 py-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-white">AssetFlow Assistant</p>
              <p className="text-xs text-brand-100">
                {isSignedIn && user ? `Signed in as ${user.username}` : "Ask anything about the platform"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex h-7 w-7 items-center justify-center rounded-md text-brand-100 hover:bg-brand-700 hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {checkingAuth ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Loading…</div>
          ) : !isSignedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <ChatIcon className="h-8 w-8 text-brand-600 dark:text-brand-400" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sign in with your Puter account to chat with the AssetFlow assistant. Your usage is billed to your
                own Puter account — AssetFlow never sees an API key.
              </p>
              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn}
                className="mt-1 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {signingIn ? "Signing in…" : "Sign in with Puter"}
              </button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Ask me how to register an asset, approve a request, run an audit — anything about AssetFlow.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-ink dark:bg-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {m.content || (isSending && i === messages.length - 1 ? "…" : "")}
                    </div>
                  </div>
                ))}
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question…"
                  disabled={isSending}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  aria-label="Send"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close help chat" : "Open help chat"}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-700 sm:right-6"
      >
        {isOpen ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
      </button>
    </>
  );
}
