import { getHistory } from "./memoryStore.js";

export type Mode = "dating_advice" | "rizz";

function cap(s: string, n = 480) {
  const out = s.trim();
  return out.length > n ? out.slice(0, n - 1).trim() + "…" : out;
}

function pickMode(m?: string): Mode {
  return m === "rizz" ? "rizz" : "dating_advice";
}

export function coachRespond(body: { sessionId: string; userMessage: string; mode?: string }) {
  const mode = pickMode(body.mode);
  const userMsg = (body.userMessage || "").trim();

  const history = getHistory(body.sessionId || "anon");
  const historyText = history.map(h => `${h.role}:${h.text}`).join("\n");

  const empathy = mode === "rizz" ? "Say less 😌" : "I hear you.";

  const action = userMsg
    ? mode === "rizz"
      ? "Short line you can send: ‘You free this week? Let’s link.’"
      : "Short suggestion: ask for a day and keep it simple — ‘Coffee this week?’"
    : "Tell me what happened in one line and I’ll write the exact reply.";

  const question = historyText.includes("How long has it been")
    ? ""
    : "How long since you last heard from them?";

  const parts = [empathy, action, question].filter(Boolean);
  return { message: cap(parts.join("\n\n")) };
}
