import React, { useEffect, useRef } from 'react';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; coach?: any };

export default function ChatThread({ messages, containerRef }: { messages: Msg[]; containerRef?: React.RefObject<HTMLDivElement> }) {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const ref = containerRef ?? internalRef;

  const isNearBottom = () => {
    const el = ref.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance < 120; // px threshold
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const shouldAutoScroll = isNearBottom();
    if (shouldAutoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  return (
    <div ref={ref} className="flex-1 overflow-y-auto px-4 py-4 pb-40">
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed shadow-sm whitespace-pre-line ${m.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              {m.text}
            </div>

            {/* If assistant message contains structured coach data, render chips and questions */}
            {m.role === 'assistant' && m.coach ? (
              <div className="mt-2 ml-3 flex flex-col gap-2">
                {/* Draft texts as chips/buttons */}
                {Array.isArray(m.coach.draft_texts) && m.coach.draft_texts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {m.coach.draft_texts.map((dt: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(dt);
                          } catch (e) {
                            // ignore
                          }
                          window.dispatchEvent(new CustomEvent('spark:draft', { detail: { text: dt } }));
                        }}
                        className="text-xs px-3 py-1 rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50"
                        title="Tap to copy/send"
                      >
                        {dt}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Questions as subtle follow-ups */}
                {Array.isArray(m.coach.questions) && m.coach.questions.length > 0 ? (
                  <div className="mt-1 text-sm text-zinc-500">
                    <div className="text-xs text-zinc-400">Quick question</div>
                    <div className="flex flex-col gap-1 mt-1">
                      {m.coach.questions.map((q: string, i: number) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent('spark:question', { detail: { text: q } }))}
                          className="text-sm text-zinc-600 text-left hover:underline"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div ref={endRef} />
    </div>
  );
}
