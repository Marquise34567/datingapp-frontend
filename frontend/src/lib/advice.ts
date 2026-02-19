export type AdviceResponse = {
  message?: string;
  insights?: any;
  strategy?: { headline?: string; why?: string; do?: string[]; dont?: string[] };
  replies?: Record<string, string[]>;
  datePlan?: any;
};

export async function fetchAdvice(payload: any): Promise<AdviceResponse> {
  const API_URL = import.meta.env.VITE_API_URL;

  // If an API URL is provided via env, forward the request to the backend.
  if (API_URL) {
    // Normalize fields the backend accepts (message / text / input)
    const rawMode = payload?.mode ?? payload?.tab;
    const normalizedMode = rawMode === 'dating_advice' ? 'dating' : rawMode;

    const body = {
      // prefer explicit message/text then fall back to common keys
      message: payload?.message ?? payload?.text ?? payload?.userMessage ?? payload?.input ?? '',
      mode: normalizedMode,
      // forward everything else so backend can use conversation/sessionId/etc
      conversation: payload?.conversation,
      sessionId: payload?.sessionId,
      situation: payload?.situation,
      goal: payload?.goal,
      tone: payload?.tone,
    };

    const res = await fetch(`${API_URL}/api/advice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = { raw: text };
    }

    if (!res.ok) {
      // Throw a structured error so the UI can render status, message and raw body
      throw { status: res.status, body: data, raw: text };
    }

    return data as AdviceResponse;
  }

  // Fallback mock response for local development without a backend.
  await new Promise((r) => setTimeout(r, 700));
  const userMessage = payload?.userMessage || "(no input)";

  return {
    message: `Suggested reply for: ${userMessage}\n\nKeep it confident, brief, and friendly.`,
    strategy: {
      headline: "Quick plan",
      why: "This reply keeps momentum while sounding casual.",
    },
    replies: {
      confident: [`${userMessage} — sounds great. When are you free?`],
      playful: [`${userMessage} 😄 Let’s do this — when works for you?`],
      sweet: [`${userMessage} ❤️ Would love to see you — what about Friday?`],
    },
  };
}
