"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { fetchAdvice } from "../lib/advice";
import Button from "./ui/Button";
import { fetchEntitlements, Entitlements } from "../lib/entitlements";
import { createCheckoutSession } from "../lib/checkout";
import Composer from "./ui/Composer";
import ChatThread from "./ui/ChatThread";

type Msg = { id: string; role: "user" | "assistant"; text: string; coach?: any; ts?: number };

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
      ts: Date.now(),
    },
    {
      id: "a2",
      role: "assistant",
      text: "Pick a mode (Dating advice or Rizz), then type what happened. I’ll tell you what to say next.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const canSend = useMemo(() => input.trim().length > 0, [input]);
  const placeholders = [
    "She said 'lol sure' — what does that mean?",
    "He hasn't replied in 2 days.",
    'How do I ask her out without sounding try-hard?',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    if (input.trim().length > 0) return;
    const id = setInterval(() => setPlaceholderIndex((i) => (i + 1) % placeholders.length), 3200);
    return () => clearInterval(id);
  }, [input]);
  const placeholderText = input.trim().length > 0 ? "" : placeholders[placeholderIndex];
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [mode, setMode] = useState<"dating_advice" | "rizz" | "strategy">("dating_advice");
  const [sessionId] = useState(() => (crypto as any).randomUUID());
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [upgradeShownThisConversation, setUpgradeShownThisConversation] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  function formatAdviceToText(result: any) {
    if (typeof result?.message === "string" && result.message.trim().length > 0) {
      return result.message;
    }

    const headline = result?.strategy?.headline ? `${result.strategy.headline}\n` : "";
    const why = result?.strategy?.why ? `${result.strategy.why}\n` : "";
    const pick = result?.replies?.confident?.[0] || result?.replies?.playful?.[0] || result?.replies?.sweet?.[0] || "";
    return `${headline}${why}${pick}`.trim();
  }

  function getErrorMessage(err: any) {
    if (err?.status) {
      const body = err.body ?? (err.raw ? err.raw : null);
      const message = body?.message ?? body?.error ?? body ?? null;
      return JSON.stringify({ status: err.status, message, body }, null, 2);
    }

    const axiosMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data;

    if (typeof axiosMsg === "string") return axiosMsg;
    if (axiosMsg) return JSON.stringify(axiosMsg, null, 2);

    if (err instanceof Error) return err.message;

    if (typeof err === "string") return err;

    return JSON.stringify(err, null, 2);
  }

  async function pushUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed, ts: Date.now() }]);
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
          ts: Date.now(),
          coach: result,
        },
      ]);
    } catch (e: any) {
      console.error('fetchAdvice error', e);
      if (e?.status === 429 && e?.body?.code === 'DAILY_LIMIT') {
        setDailyLimitReached(true);
        setShowModal(true);

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

  async function pushStrategy(text: string) {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed, ts: Date.now() }]);
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
          ts: Date.now(),
        },
      ]);
    } catch (e: any) {
      console.error('fetchAdvice error', e);
      if (e?.status === 429 && e?.body?.code === 'DAILY_LIMIT') {
        setDailyLimitReached(true);
        setShowModal(true);

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

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const url = await createCheckoutSession(sessionId);
      window.location.href = url;
    } catch (e: any) {
      console.error('checkout error', e);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
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

        {/* Main layout */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Chat panel */}
          <div className="imessage-card rounded-3xl border overflow-hidden flex h-full min-h-0 flex-col relative">
            {/* Modern chat header */}
            <div className="imessage-header px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="avatar">S</div>
                  <div>
                    <div className="text-sm font-semibold">Spark Coach</div>
                    <div className="text-xs text-zinc-500">Modern dating coach • online</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="chip">New convo</button>
                  <button className="chip">Export</button>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 min-h-0">
              {/* @ts-ignore: allow passing containerRef and loading to ChatThread */}
              <ChatThread messages={messages} containerRef={listRef} loading={loading} />
            </div>

            {/* pinned composer overlay */}
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                  <div className="max-w-3xl mx-auto px-4 pb-4 pointer-events-auto">
                    <Composer
                      mode={mode}
                      setMode={(m) => setMode(m as 'dating_advice' | 'rizz' | 'strategy')}
                      input={input}
                      setInput={(s) => setInput(s)}
                      onSend={(t) => pushUser(t)}
                      onQuickAnalyze={(t) => pushStrategy(t)}
                      loading={loading}
                      placeholder={placeholderText}
                      isPremium={!!entitlements?.isPremium}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
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
                      <span style={{ fontSize: 18 }}>{emoji}</span>
                      <span style={{ marginLeft: 12 }}>Make it match this vibe</span>
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
                  <Button type="button" onClick={() => setShowInsights(true)} className="w-full" variant="primary" size="md">
                    Finish conversation
                  </Button>
                </div>
              </div>
            </aside>
          )}
        </section>

        {/* Premium modal */}
        {showModal && (
          <div className="fixed inset-0 z-50">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

            {/* center wrapper */}
            <div className="relative z-10 flex min-h-full items-center justify-center p-4">
              <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start p-6">
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
                          onClick={handleUpgrade}
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? 'Starting checkout…' : 'Upgrade & Checkout'}
                        </Button>
                      </div>
                      <div className="mt-3 text-xs text-zinc-400">No commitment — cancel anytime.</div>
                    </div>
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
