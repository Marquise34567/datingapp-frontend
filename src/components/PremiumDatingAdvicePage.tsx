"use client";

import React, { useMemo, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "assistant"; text: string };

// Quick actions removed per request

const EXAMPLES = [
  "She said: “lol sure” — what does that mean?",
  "Write a confident reply without sounding desperate.",
  "Plan a first date: fun, low pressure, not expensive.",
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PremiumDatingAdvicePage() {
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "a1",
      role: "assistant",
      text:
        "Tell me what you want help with. Paste the convo or describe the vibe — I’ll craft replies and a plan that fits your style.",
    },
    {
      id: "a2",
      role: "assistant",
      text:
        "Pick a quick action below, or type your situation. (Backend later — this is the premium UI.)",
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function pushUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    // user sent a new message -> hide insights until finished again
    setShowInsights(false);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text:
          "Got it — when the backend is connected, I’ll return tailored advice here (tone, intent, and 3 reply options).",
      },
    ]);
    setInput("");
    scrollToBottom();
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-zinc-50 to-white text-zinc-950">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-zinc-950 text-white grid place-items-center font-semibold">
              💬
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">DateCoach</div>
              <div className="text-xs text-zinc-500">Premium dating advice</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Good
            </span>
            <span className="text-sm text-zinc-500">7.4/10</span>
            <button className="ml-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50" onClick={() => setShowModal(true)}>
              Upgrade
            </button>
            <button className="ml-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Personalized texts • date plans • profile help
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Text smarter. Date smoother.{' '}
              <span className="text-zinc-500">No cringe.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base text-zinc-600">
              Paste a conversation and get replies that match your vibe — playful, confident,
              sweet, or direct. Build a simple plan that actually gets the date set.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => pushUser(e)}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Premium card removed from hero - available via Upgrade button */}
        </section>

        {/* Main layout */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Chat panel */}
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-[0_16px_40px_-28px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-zinc-950 to-zinc-700" />
                <div>
                  <div className="text-sm font-semibold">Coach</div>
                  <div className="text-xs text-zinc-500">iMessage-style advice</div>
                </div>
              </div>
              <div className="text-xs text-zinc-500">Online</div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="h-[56vh] overflow-y-auto px-4 py-4 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.05),transparent_50%)]"
            >
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cx(
                        "max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed shadow-sm",
                        m.role === "user"
                          ? "bg-[#007AFF] text-white rounded-br-lg"
                          : "bg-zinc-100 text-zinc-900 rounded-bl-lg"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions removed */}

            {/* Composer */}
            <div className="border-t border-zinc-100 bg-white px-4 py-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-zinc-900/10">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your situation… (paste the convo, what they said, and what you want)"
                    rows={1}
                    className="max-h-28 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-zinc-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (canSend) pushUser(input);
                      }
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-[11px] text-zinc-400">Enter to send • Shift+Enter new line</div>
                    <div className="text-[11px] text-zinc-400">
                      Privacy-first (UI placeholder)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => pushUser(input)}
                  disabled={!canSend}
                  className={cx(
                    "h-11 rounded-2xl px-4 text-sm font-semibold shadow-sm",
                    canSend
                      ? "bg-zinc-950 text-white hover:bg-zinc-800"
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  )}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Side panel: show only after conversation is finished */}
          {showInsights ? (
            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.35)]">
                <div className="text-sm font-semibold">Conversation Insights</div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-4xl font-semibold">7.4</div>
                  <div className="text-right">
                    <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Good
                    </div>
                    <div className="mt-2 text-sm text-zinc-600">Playful</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>Clarity</span>
                    <span className="text-zinc-500">Good</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confidence</span>
                    <span className="text-zinc-500">Medium</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Momentum</span>
                    <span className="text-zinc-500">High</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.35)]">
                <div className="text-sm font-semibold">Suggested Replies</div>
                <div className="mt-4 grid gap-2">
                  {['😄', '😉', '❤️', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => pushUser(`Use this vibe: ${emoji}`)}
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm shadow-sm hover:bg-zinc-50"
                    >
                      {emoji} Make it match this vibe
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : (
            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.35)]">
                <div className="text-sm font-semibold">Conversation in progress</div>
                <p className="mt-3 text-sm text-zinc-600">Finish the conversation to see insights and suggested replies.</p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowInsights(true)}
                    className="w-full rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                  >
                    Finish conversation
                  </button>
                </div>
              </div>
            </aside>
          )}
        </section>

        {/* Premium modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
            <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">Premium</div>
                  <div className="mt-1 text-xs text-zinc-500">Best for daily texting</div>
                </div>
                <button className="text-zinc-500" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="mt-4 text-3xl font-semibold">
                $19<span className="text-base font-medium text-zinc-400">/mo</span>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-zinc-600">
                <li>• Unlimited replies + rewrites</li>
                <li>• Tone + intent detection</li>
                <li>• “Make it smoother” slider</li>
                <li>• Date plan + follow-up texts</li>
              </ul>

              <button
                type="button"
                className="mt-6 w-full rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                onClick={() => {
                  // placeholder for upgrade action
                  setShowModal(false);
                }}
              >
                Upgrade to Premium
              </button>

              <div className="mt-3 text-xs text-zinc-400">Backend later: this will start checkout.</div>
            </div>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} DateCoach • Premium UI (backend coming next)
        </footer>
      </main>
    </div>
  );
}
