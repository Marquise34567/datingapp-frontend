"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { fetchAdvice } from "../lib/advice";
import Button from "./ui/Button";
import { fetchEntitlements, Entitlements } from "../lib/entitlements";
import { createCheckoutSession } from "../lib/checkout";
import Composer from "./ui/Composer";
import ChatThread from "./ui/ChatThread";

type Msg = { id: string; role: "user" | "assistant"; text: string; coach?: any };

// Quick actions removed per request

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PremiumDatingAdvicePage() {
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "a1",

      role: "assistant",
      text: "Tell me what you want help with — paste the convo or describe the vibe.",
    },
    {
      id: "a2",
      role: "assistant",
      text: "Pick a mode (Dating advice or Rizz), then type what happened. I’ll tell you what to say next.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [mode, setMode] = useState<"dating_advice" | "rizz" | "strategy">("dating_advice");
  const [sessionId] = useState(() => (crypto as any).randomUUID());
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [upgradeShownThisConversation, setUpgradeShownThisConversation] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0, [input]);
  const placeholders = [
    "She said 'lol sure' — what does that mean?",
    'He hasn\'t replied in 2 days.',
    'How do I ask her out without sounding try-hard?',
    'Are we exclusive or not?',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    if (input.trim().length > 0) return;
    const id = setInterval(() => setPlaceholderIndex((i) => (i + 1) % placeholders.length), 3200);
    return () => clearInterval(id);
  }, [input]);
  const placeholderText = input.trim().length > 0 ? '' : placeholders[placeholderIndex];

  // fetch entitlements on load
  useEffect(() => {
    (async () => {
      try {
        const e = await fetchEntitlements(sessionId);
        setEntitlements(e);
        if (e && typeof e.dailyRemaining === 'number' && e.dailyRemaining <= 0 && !e.isPremium) {
          setDailyLimitReached(true);
        }
      } catch (err) {
        console.warn('fetchEntitlements error', err);
      }
    })();
  }, [sessionId]);

  // Listen for draft chip clicks from ChatThread: copy -> set input
  useEffect(() => {
    function onDraft(e: any) {
      const text = e?.detail?.text;
      if (typeof text === 'string') {
        setInput(text);
        // focus composer if present
        const el = document.querySelector('textarea') as HTMLTextAreaElement | null;
        if (el) {
          el.focus();
        }
      }
    }
    window.addEventListener('spark:draft', onDraft as EventListener);
    window.addEventListener('spark:question', onDraft as EventListener);
    return () => {
      window.removeEventListener('spark:draft', onDraft as EventListener);
      window.removeEventListener('spark:question', onDraft as EventListener);
    };
  }, []);
  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  // Auto-scroll when messages change, but only if the user is already near the bottom.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const NEAR_BOTTOM_PX = 160;
    if (distanceFromBottom <= NEAR_BOTTOM_PX) {
      scrollToBottom();
    }
    // otherwise, do not force-scroll so users can read history
  }, [messages]);

  function formatAdviceToText(result: any) {
    // Prefer server-provided single-message response
    if (typeof result?.message === "string" && result.message.trim().length > 0) {
      return result.message;
    }

    // Fallback: stringify minimal parts if message absent
    const headline = result?.strategy?.headline ? `${result.strategy.headline}\n` : "";
    const why = result?.strategy?.why ? `${result.strategy.why}\n` : "";
    const pick = result?.replies?.confident?.[0] || result?.replies?.playful?.[0] || result?.replies?.sweet?.[0] || "";
    return `${headline}${why}${pick}`.trim();
  }

  function getErrorMessage(err: any) {
    // our fetchAdvice throws structured errors { status, body, raw }
    if (err?.status) {
      const body = err.body ?? (err.raw ? err.raw : null);
      const message = body?.message ?? body?.error ?? body ?? null;
      return JSON.stringify({ status: err.status, message, body }, null, 2);
    }
    // axios style
    const axiosMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data;

    if (typeof axiosMsg === "string") return axiosMsg;
    if (axiosMsg) return JSON.stringify(axiosMsg, null, 2);

    // fetch style
    if (err instanceof Error) return err.message;

    if (typeof err === "string") return err;

    return JSON.stringify(err, null, 2);
  }

  async function pushUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const conversation = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({ from: m.role === "user" ? "me" : "them", text: m.text }));

      const result = await fetchAdvice({
        situation: "General dating conversation",
        goal: "Get the best next message + plan",
        tone: "confident and smooth",
        conversation,
        message: trimmed,
        mode,
        sessionId,
      });

      const assistantText = formatAdviceToText(result);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: assistantText || "I generated advice, but it returned empty.",
          coach: result,
        },
      ]);
    } catch (e: any) {
      console.error('fetchAdvice error', e);
      if (e?.status === 429 && e?.body?.code === 'DAILY_LIMIT') {
        setDailyLimitReached(true);
        setShowModal(true);

          // Show upgrade modal mid-conversation for free users once
          try {
            if (entitlements && !entitlements.isPremium && !upgradeShownThisConversation) {
              // If conversation already has a few turns, show mid-convo; otherwise show after this reply
              const priorTurns = messages.filter((m) => m.role === 'user' || m.role === 'assistant').length;
              if (priorTurns >= 3) {
                setShowModal(true);
                setUpgradeShownThisConversation(true);
              }
            }
          } catch (e) {
            console.warn('upgrade modal check failed', e);
          }
        try {
          const e2 = await fetchEntitlements(sessionId);
          setEntitlements(e2);
        } catch (er) {
          console.warn('refresh entitlements failed', er);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function pushStrategy(text: string) {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const conversation = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({ from: m.role === "user" ? "me" : "them", text: m.text }));

      const result = await fetchAdvice({
        situation: "Quick strategist analysis",
        goal: "Fast verdict + next move",
        tone: "direct and strategic",
        conversation,
        message: trimmed,
        mode: "strategy",
        sessionId,
      });

      const assistantText = formatAdviceToText(result);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: assistantText || "I generated advice, but it returned empty.",
        },
      ]);
    } catch (e: any) {
      console.error('fetchAdvice error', e);
      if (e?.status === 429 && e?.body?.code === 'DAILY_LIMIT') {
        setDailyLimitReached(true);
        setShowModal(true);

          // Show upgrade modal mid-conversation for free users once
          try {
            if (entitlements && !entitlements.isPremium && !upgradeShownThisConversation) {
              const priorTurns = messages.filter((m) => m.role === 'user' || m.role === 'assistant').length;
              if (priorTurns >= 3) {
                setShowModal(true);
                setUpgradeShownThisConversation(true);
              }
            }
          } catch (e) {
            console.warn('upgrade modal check failed', e);
          }
        try {
          const e2 = await fetchEntitlements(sessionId);
          setEntitlements(e2);
        } catch (er) {
          console.warn('refresh entitlements failed', er);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function contactSupport() {
    try {
      const res = await fetch(`/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const j = await res.json();
      if (!res.ok) throw j;
      alert('Support request sent. We will respond shortly.');
    } catch (err) {
      console.warn('support error', err);
      alert('Support request failed. Premium only.');
    }
  }

  return (
    <div className="min-h-screen app-bg">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-linear-to-br from-white/5 to-white/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-linear-to-br from-zinc-950 to-zinc-700 text-white grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7-4.35-9.2-7.05C-0.1 8.3 5.2 3 8.7 5.6 10.3 6.9 12 9 12 9s1.7-2.1 3.3-3.4C18.8 3 24.1 8.3 21.2 13.95 19 17.65 12 21 12 21z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold gradient-text">Sparkd</div>
              <div className="text-xs text-zinc-500">Modern dating coach</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {entitlements && entitlements.isPremium ? 'Premium' : 'Free'}
            </span>
            {entitlements && entitlements.isPremium ? (
              <Button type="button" variant="ghost" size="sm" onClick={contactSupport}>
                Contact Priority Support
              </Button>
            ) : null}

            <span className="text-sm text-zinc-500">7.4/10</span>
            <Button size="sm" variant="primary" className="ml-2" onClick={() => setShowModal(true)}>
              Upgrade
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
        <main className="mx-auto max-w-6xl px-4 py-8 relative min-h-[calc(100vh-80px)]">
          <div className="hearts-decor" />
        {/* HeroCard removed */}

        {/* Main layout */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Chat panel */}
          <div className="rounded-3xl border border-zinc-200 bg-white premium-shadow elevated overflow-hidden flex h-full min-h-0 flex-col">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-zinc-950 to-zinc-700 text-white grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2v3" />
                    <path d="M12 19v3" />
                    <path d="M4.2 4.2L6 6" />
                    <path d="M18 18l1.8 1.8" />
                    <path d="M2 12h3" />
                    <path d="M19 12h3" />
                    <path d="M4.2 19.8L6 18" />
                    <path d="M18 6l1.8-1.8" />
                    <path d="M12 7a5 5 0 100 10 5 5 0 000-10z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-amber-400" fill="currentColor" aria-hidden="true">
                      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.176L12 18.896l-7.336 3.876 1.402-8.176L.132 9.21l8.2-1.192z" />
                    </svg>
                    <span>Spark</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-zinc-500">Online</div>
            </div>

            {/* Messages + composer: messages scroll, composer stays pinned at bottom */}
            <div className="flex h-full min-h-0 flex-col">
              <ChatThread messages={messages} containerRef={listRef} />

              <div className="shrink-0 z-20 border-t border-black/5 bg-white/80 backdrop-blur-sm px-0 py-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Composer
                      mode={mode}
                      setMode={(m) => setMode(m as 'dating_advice' | 'rizz' | 'strategy')}
                      input={input}
                      setInput={(s) => setInput(s)}
                      onSend={(t) => pushUser(t)}
                      onQuickAnalyze={(t) => pushStrategy(t)}
                      loading={loading}
                      disabledSend={dailyLimitReached}
                      placeholder={placeholderText}
                      isPremium={!!entitlements?.isPremium}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* errors are logged to console (no UI error pane) */}
          </div>

          {/* Side panel: show only after conversation is finished */}
          {showInsights ? (
            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 premium-shadow elevated">
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

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 premium-shadow elevated">
                <div className="text-sm font-semibold">Suggested Replies</div>
                <div className="mt-4 grid gap-2">
                  {['😄', '😉', '❤️', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => pushUser(`Use this vibe: ${emoji}`)}
                      className="suggested-reply w-full text-left"
                    >
                      <span style={{fontSize:18}}>{emoji}</span>
                      <span style={{marginLeft:12}}>Make it match this vibe</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : (
            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 premium-shadow elevated">
                <div className="text-sm font-semibold">Conversation in progress</div>
                <p className="mt-3 text-sm text-zinc-600">Finish the conversation to see insights and suggested replies.</p>
                <div className="mt-4">
                  <Button type="button" onClick={() => { setShowInsights(true); if (entitlements && !entitlements.isPremium) { setShowModal(true); setUpgradeShownThisConversation(true); } }} className="w-full" variant="primary" size="md">
                    Finish conversation
                  </Button>
                </div>
              </div>
            </aside>
          )}
        </section>

        {/* Premium modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
                <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">Spark Premium</div>
                          <div className="mt-1 text-sm text-zinc-500">Unlimited conversations, advanced coaching, and priority support.</div>
                        </div>
                        <button className="text-zinc-500" onClick={() => setShowModal(false)}>✕</button>
                      </div>

                      <div className="mt-6 flex items-center gap-6">
                        <div className="text-4xl font-extrabold">$19<span className="text-base font-medium text-zinc-400">/mo</span></div>
                        <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'linear-gradient(90deg,#ff7a59,#ff4d8d)' }}>Popular</div>
                      </div>

                      <ul className="mt-6 space-y-3 text-sm text-zinc-700">
                        <li>• Unlimited Spark conversations every day</li>
                        <li>• Advanced, richer coaching replies (more options + deeper steps)</li>
                        <li>• Priority model capacity and faster responses</li>
                        <li>• Tone controls, date plans, and follow-up sequences</li>
                      </ul>

                      <div className="mt-6 text-sm text-zinc-500">Secure checkout by Stripe.</div>
                    </div>

                    <div className="lg:col-span-1">
                      <div className="rounded-xl border border-zinc-100 p-4 shadow-sm bg-linear-to-br from-white to-zinc-50">
                        <div className="text-xs text-zinc-500">Your plan</div>
                        <div className="mt-2 text-lg font-semibold">Spark Premium</div>
                        <div className="mt-3">
                          <Button
                            type="button"
                            className="w-full"
                            variant="primary"
                            size="md"
                            onClick={async () => {
                              try {
                                const url = await createCheckoutSession(sessionId);
                                // open checkout in new tab
                                window.open(url, '_blank');
                                setShowModal(false);
                              } catch (err) {
                                console.error('checkout error', err);
                                alert('Failed to start checkout. Please try again.');
                              }
                            }}
                          >
                            Upgrade & Checkout
                          </Button>
                        </div>
                        <div className="mt-3 text-xs text-zinc-400">No commitment — cancel anytime.</div>
                      </div>
                    </div>
                  </div>
                </div>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Sparkd • Premium UI (backend coming next)
        </footer>
      </main>
    </div>
  );
}
