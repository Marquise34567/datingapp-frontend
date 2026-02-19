export type AdviceResponse = {
  message?: string;
  insights?: any;
  strategy?: { headline?: string; why?: string; do?: string[]; dont?: string[] };
  replies?: Record<string, string[]>;
  datePlan?: any;
};

export async function fetchAdvice(payload: any): Promise<AdviceResponse> {
  // Try to call the backend at the relative `/api/advice` endpoint.
  // If the network request fails (no backend running), fall back to a mock response.
  // If the backend responds with a non-2xx status, rethrow the structured error
  // so the UI can react (e.g. DAILY_LIMIT 429).
  try {
    // Normalize fields the backend accepts (message / text / input)
    const rawMode = payload?.mode ?? payload?.tab;
    const normalizedMode = rawMode === 'dating_advice' ? 'dating' : rawMode;

    // send `text` consistently so backend validation sees it
    const body = {
      text: payload?.message ?? payload?.text ?? payload?.userMessage ?? payload?.input ?? '',
      mode: normalizedMode,
      conversation: payload?.conversation,
      sessionId: payload?.sessionId,
      situation: payload?.situation,
      goal: payload?.goal,
      tone: payload?.tone,
    };

    const res = await fetch(`/api/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    let data: any = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      // backend might be returning plain text
    }

    console.log("[advice] status:", res.status);
    console.log("[advice] raw:", rawText);
    console.log("[advice] json:", data);

    // normalize possible response shapes
    const advice =
      (data?.advice && String(data.advice)) ||
      (data?.text && String(data.text)) ||
      (data?.message && String(data.message)) ||
      (data?.result?.advice && String(data.result.advice)) ||
      (data?.result?.text && String(data.result.text)) ||
      (data?.output && String(data.output)) ||
      "";

    // If backend gave an error, don't show "returned empty"
    if (!res.ok) {
      const errMsg =
        (data?.error && String(data.error)) ||
        (data?.message && String(data.message)) ||
        `Request failed (${res.status})`;
      throw new Error(errMsg);
    }

    // If success but empty advice, surface the real payload for debugging
    if (!advice.trim()) {
      throw new Error(
        `Backend returned success but no advice text. Keys: ${Object.keys(data || {}).join(", ")}`
      );
    }

    // build a normalized response preserving common fields
    const out: AdviceResponse = {
      message: advice,
      insights: data?.insights,
      strategy: data?.strategy,
      replies: data?.replies,
      datePlan: data?.datePlan,
    };

    return out;
  } catch (err: any) {
    // Network error or fetch failed — provide a local mock so the app still works offline.
    await new Promise((r) => setTimeout(r, 700));
    const userMessage = payload?.userMessage || '(no input)';

    return {
      message: `Suggested reply for: ${userMessage}\n\nKeep it confident, brief, and friendly.`,
      strategy: {
        headline: 'Quick plan',
        why: 'This reply keeps momentum while sounding casual.',
      },
      replies: {
        confident: [`${userMessage} — sounds great. When are you free?`],
        playful: [`${userMessage} 😄 Let’s do this — when works for you?`],
        sweet: [`${userMessage} ❤️ Would love to see you — what about Friday?`],
      },
    };
  }
}
