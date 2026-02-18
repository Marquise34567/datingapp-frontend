"use client";

import React, { useMemo, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "assistant"; text: string };

const SUGGESTED = [
  "Draft 3 replies",
  "Set a plan",
  "Date plan",
  "What should I say next?",
  "Help me respond flirtier",
  "Make it confident but not cringe",
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DatingAdviceUI() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m1",
      role: "assistant",
      text:
        "How can I help today? Reply to a message, plan an elegant date, or polish your profile. Paste the convo or briefly describe the situation — I’ll provide confident, tasteful suggestions tailored to your style.",
    },
  ]);
  const [input, setInput] = useState("");
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const listRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === 'dark';
  const isLight = theme === 'light';
  const [isTyping, setIsTyping] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setInput("");
    setIsTyping(true);
    scrollToBottom();

    const delay = 700 + Math.floor(Math.random() * 800);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            "Got it — when you hook the backend, I’ll generate tailored advice here. For now this is the premium chat UI.",
        },
      ]);
      setIsTyping(false);
      scrollToBottom();
    }, delay);
  }

  return (
    <div className={cx("min-h-screen", isLight ? "text-zinc-900 theme-light" : "text-white theme-dark")}>
      <header
        className={cx(
          "sticky top-0 z-10 border-b backdrop-blur",
          isLight ? "border border-zinc-100 bg-white/95 shadow-sm" : "border-zinc-200/70 bg-white/6"
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={cx(
                "h-9 w-9 rounded-full grid place-items-center font-semibold text-sm",
                isLight ? "text-white bg-linear-to-br from-[#fff6f8] to-[#ffeff4] ring-1 ring-emerald-100" : "text-white bg-zinc-900"
              )}
            >
              ♥
            </div>
            <div className="leading-tight">
              <div className="font-semibold premium-heading">MatchCoach</div>
              <div className={cx("text-xs", isLight ? "premium-sub" : "text-zinc-300")}>Dating app — but for advice</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#fff0f3] px-3 py-1 text-xs font-medium text-[#ff3b6b] border border-[#ffd6df]">♥ Match</span>
            <span className="text-sm text-zinc-300">7.4/10</span>

            <div className={cx("ml-3 flex items-center gap-1 rounded-full p-1", isLight ? "bg-white/80 shadow-sm" : "bg-white/6")}>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cx("rounded-full px-3 py-1 text-xs", theme === 'light' ? "bg-white/9 text-zinc-900" : "text-white/80 hover:bg-white/8")}
              >
                Light
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cx("rounded-full px-3 py-1 text-xs", theme === 'dark' ? "bg-white/9 text-zinc-900" : "text-white/80 hover:bg-white/8")}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_380px]">
        <section className="relative">
          <div className="mx-auto w-full max-w-2xl">
            <div className="phone-shell rounded-3xl overflow-hidden max-w-full">
              <div className="rounded-2xl overflow-hidden card-surface">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={cx("h-10 w-10 rounded-2xl", isLight ? "bg-linear-to-br from-emerald-50 to-emerald-100 ring-1 ring-emerald-100" : "bg-linear-to-br from-zinc-900 to-zinc-700")}
                    />
                    <div>
                      <div className={cx("text-sm font-semibold", isLight ? "premium-heading" : undefined)}>Coach</div>
                      <div className={cx("text-xs", isLight ? "premium-sub" : "text-zinc-400")}>iMessage-style chat</div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400">Online</div>
                </div>

                <div
                  ref={listRef}
                  className={cx(
                    "h-[62vh] overflow-y-auto px-4 py-4",
                    isLight
                      ? "bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent_45%)]"
                      : "bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_45%)]"
                  )}
                >
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const isIntro = m.id === "m1";
                      return (
                        <div key={m.id} className={cx("flex items-end", m.role === "user" ? "justify-end" : "justify-start")}>
                          {m.role === "assistant" && (
                            <div className="mr-3 mt-1">
                              <div className={cx("avatar-sm", isLight ? "bg-linear-to-br from-emerald-50 to-emerald-100" : "bg-linear-to-br from-zinc-900 to-zinc-700")} />
                            </div>
                          )}

                          <div
                            className={cx(
                              "max-w-[85%]",
                              "bubble",
                              "premium-text",
                              m.role === "user" ? "bubble-user" : "bubble-assistant",
                              isIntro && (isLight ? "premium-heading text-base" : "text-white/90 font-semibold"),
                              isLight
                                ? m.role === "user"
                                  ? "bg-linear-to-r from-[#ff6b89] to-[#ff3b6b] text-white"
                                  : "bg-white border border-zinc-100 shadow-sm text-zinc-900"
                                : m.role === "user"
                                ? "bg-amber-500 text-black"
                                : "bg-zinc-900 text-white/90"
                            )}
                          >
                            {m.text}
                          </div>

                          {m.role === "user" && <div className="w-9" />}
                        </div>
                      );
                    })}
                      {isTyping && (
                        <div className={cx("flex items-end justify-start")}>
                          <div className="mr-3 mt-1">
                            <div className={cx("avatar-sm", isLight ? "bg-linear-to-br from-emerald-50 to-emerald-100" : "bg-linear-to-br from-zinc-900 to-zinc-700")} />
                          </div>

                          <div className={cx("bubble bubble-assistant typing-bubble", isLight ? "text-zinc-700" : "text-white/90")}></div>
                        </div>
                      )}
                  </div>
                </div>

                <div className={cx("border-t px-4 py-3", isLight ? "border-zinc-100 bg-white/95" : "border-zinc-100 bg-white/6")}>
                  <div className="flex items-end gap-2">
                    <div
                      className={cx(
                        "flex-1 rounded-2xl px-3 py-2 shadow-sm focus-within:ring-2 input-shell",
                        isLight
                          ? "border border-zinc-100 bg-white focus-within:ring-emerald-200"
                          : "border border-zinc-200 bg-white/5 focus-within:ring-zinc-900/10"
                      )}
                    >
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type what you need help with…"
                        rows={1}
                        className="max-h-28 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-zinc-400"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (canSend) send(input);
                          }
                        }}
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SUGGESTED.slice(0, 3).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => send(s)}
                            className={cx(
                              "rounded-full px-3 py-1 text-xs",
                              isLight
                                ? "premium-chip"
                                : "border border-zinc-700 bg-white/6 text-white/85 hover:bg-white/8"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => send(input)}
                      disabled={!canSend}
                      className={cx(
                        "h-11 px-4 rounded-2xl text-sm font-semibold shadow-sm",
                        canSend
                          ? isLight
                            ? "premium-button"
                            : "bg-zinc-900 text-white hover:bg-zinc-800"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      )}
                    >
                      Send
                    </button>
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-400">Enter to send • Shift+Enter for new line</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className={cx("rounded-3xl p-5 card-surface", isLight ? "border border-zinc-100 bg-white shadow-sm" : "border border-zinc-200 bg-white/5")}>
            <div className="flex items-center justify-between">
              <div className={cx("text-sm font-semibold premium-heading", isLight ? "text-zinc-800" : undefined)}>Premium</div>
              <span className={cx("rounded-full px-3 py-1 text-xs font-semibold", isLight ? "bg-[#fff0f3] text-[#ff3b6b]" : "bg-zinc-900 text-white")}>
                $19/mo
              </span>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>• Unlimited replies + rewrites</li>
              <li>• Tone + intent detection</li>
              <li>• “Say it smoother” button</li>
              <li>• Date plan + follow-ups</li>
            </ul>

            <button
              type="button"
              className={cx("mt-5 w-full rounded-2xl py-3 text-sm font-semibold", isLight ? "premium-button" : "bg-zinc-900 text-white hover:bg-zinc-800")}
            >
              Upgrade
            </button>

            <p className="mt-3 text-xs text-zinc-400">(Backend later) This button will open checkout.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
