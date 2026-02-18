import { getHistory, pushTurn } from "./memoryStore.js";
import { ollamaChat } from "./llmOllama.js";

type Mode = "dating_advice" | "rizz";
type Intent =
  | "greeting"
  | "no_reply"
  | "ask_out"
  | "reply_help"
  | "define"
  | "conflict"
  | "breakup"
  | "apology"
  | "flirt"
  | "general";
  function norm(s = "") {
    return s.toLowerCase().replace(/\s+/g, " ").trim();
  }
  function hasAny(t: string, words: string[]) {
    return words.some(w => t.includes(w));
  }
  function rand<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * Math.random() * arr.length)];
  }
  function clamp(s: string, max = 520) {
    const x = s.trim();
    return x.length > max ? x.slice(0, max - 1).trim() + "…" : x;
  }

  function detectIntent(tRaw: string) {
    const t = norm(tRaw);
    if (!t) return "general";
    if (hasAny(t, ["hi", "hey", "yo", "hello", "wyd", "sup"])) return "greeting";
    if (hasAny(t, ["ghost", "left on read", "not replying", "dry", "ignoring", "not texting"])) return "no_reply";
    if (hasAny(t, ["ask her out", "ask him out", "date", "link", "hang", "pull up", "meet up"])) return "ask_out";
    if (hasAny(t, ["what do i say", "what should i text", "how do i reply", "what do i text back", "respond"])) return "reply_help";
    if (hasAny(t, ["what are we", "exclusive", "situationship", "relationship", "serious"])) return "define";
    if (hasAny(t, ["argue", "fight", "mad", "upset", "disrespect", "attitude"])) return "conflict";
    if (hasAny(t, ["broke up", "left me", "dumped", "breakup", "ended it"])) return "breakup";
    if (hasAny(t, ["sorry", "apologize", "my fault"])) return "apology";
    if (hasAny(t, ["flirt", "rizz", "smooth", "compliment", "game"])) return "flirt";
    return "general";
  }

  function coachStyle(mode: Mode) {
    if (mode === "rizz") {
      return {
        openers: ["Say less 😌", "Bet — we gon’ play this clean.", "Aight, we moving smart.", "Cool. No overthinking."],
        vibeWords: ["smooth", "confident", "playful"],
      };
    }
    return { openers: ["Got you.", "Okay — I hear you.", "That’s real.", "I’m with you."], vibeWords: ["calm", "direct", "kind"] };
  }

  function buildQuickReplies(mode: Mode, intent: string) {
    const dating: Record<string, string[]> = {
      greeting: ["What’s the situation?", "Talk to me — what happened?"],
      no_reply: ["Send: “All good — you still down to link this week?”", "Send: “You been busy? When you free this week?”"],
      ask_out: ["Send: “You free Thu or Sat?”", "Send: “Let’s do something simple — coffee this week?”"],
      reply_help: ["Send me what they said + what you want, I’ll write the exact reply.", "Drop the last message — I’ll craft a 1–2 sentence reply."],
      define: ["Send: “I like you — are we building or keeping it casual?”", "Send: “I’m not into guessing. Where’s your head at?”"],
      conflict: ["Send: “I don’t want to argue over text. Let’s talk later and reset.”"],
      breakup: ["Okay… protect your peace. Don’t send a paragraph.", "Do you want closure or to move on?"],
      apology: ["Keep it simple: acknowledge, take responsibility, change the behavior."],
      flirt: ["Send: “You got a vibe. When you free?”", "Send: “I’m tryna take you out. Pick a day.”"],
      general: ["Tell me what happened in one sentence — I’ll tell you what to text.", "What’s the goal: get a date, get clarity, or fall back?"],
    };
    const rizz: Record<string, string[]> = {
      greeting: ["Yo 😌 what’s the play?", "Talk to me. What happened?"],
      no_reply: ["Send: “You alive? 😭 When you free?”", "Send: “All good — you still tryna link or nah?”"],
      ask_out: ["Send: “I’m tryna see you. Thu or Sat?”"],
      reply_help: ["Drop what they said — I’ll cook a smooth one-liner.", "What’d they say + what vibe you want (playful / serious / bold)?"],
      define: ["Send: “Be real — what is this?”"],
      conflict: ["Send: “I’m not arguing over text. We’ll talk later.”"],
      breakup: ["Don’t send a novel. Keep your dignity.", "Do you want closure or peace?"],
      apology: ["Send: “You right — that was my bad. I’m sorry. I’ll do better.”"],
      flirt: ["Send: “You look good… what you doing this week?”"],
      general: ["Tell me what happened. I’ll tell you what to text.", "What’s the vibe — flirty, serious, or messy?"],
    };

    return mode === "rizz" ? (rizz as any)[intent] || rizz.general : (dating as any)[intent] || dating.general;
  }

  function historyText(sessionId: string) {
    return getHistory(sessionId).map(x => `${x.role}:${x.text}`).join("\n");
  }

  function alreadyAsked(h: string, marker: string) {
    return h.includes(marker);
  }

  type CoachReply = {
    message?: string;
    reply?: string;
    text?: string;
    advice?: string;
    error?: string;
  };

  function extractMessage(data: unknown): string {
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const d = data as any;
      return d.message ?? d.reply ?? d.text ?? d.advice ?? (d.error ? `Error: ${d.error}` : "");
    }
    return "";
  }
  async function llmAssist(params: {
    mode: Mode;
    userMessage: string;
    sessionId: string;
    intent: Intent;
  }) {
    const { mode, userMessage, sessionId, intent } = params;
    const h = getHistory(sessionId).slice(-8);
    const transcript = h.map(x => `${x.role === "user" ? "USER" : "COACH"}: ${x.text}`).join("\n");

    const system = `You are not an AI assistant.

  You are a highly emotionally intelligent, socially perceptive modern dating coach who speaks like a real human.

  You sound like:
  - A sharp but grounded friend
  - A confident older sibling
  - A modern podcast dating coach
  - Calm, witty, perceptive

  You NEVER sound robotic.
  You NEVER sound scripted.
  You NEVER sound repetitive.
  You NEVER sound like customer support.
  You NEVER over-structure your answers.
  You NEVER repeat the same opener like \`Got you.\` 
  You NEVER say:
    - \`Tell me what happened.\`
    - \`I understand how you feel.\`
    - \`As an AI...\`
    - \`Based on the information provided...\`
    - Any corporate or therapy chatbot phrasing.

  You prioritize emotional intelligence over efficiency.

  Before responding, silently analyze the user's emotional state, likely attachment pattern, power dynamic, and social subtext. Do not explain this analysis; use it to subtly improve the user's positioning.

  When you reply:
  - Reflect emotional subtext naturally (not clinical)
  - Ground the situation logically (what this signals socially)
  - Offer one clear move: practical, strategic, emotionally intelligent

  Keep replies short (2–5 lines), human, and non-repetitive. If info is missing, ask only one question. Never promote manipulation or toxicity.

  Mode: ${mode}. Intent: ${intent}.
  `.trim();

    const user = `Conversation so far:
  ${transcript}

  New user message:
  ${userMessage}

  Write the coach reply now.`.trim();

    const model = process.env.OLLAMA_MODEL || "llama3.1";
    const raw = await ollamaChat({ model, system, user, temperature: 0.25 });
    return raw as unknown;
  }

  

export async function coachBrainV2(body: {
  sessionId: string;
  userMessage: string;
  mode?: Mode;
}): Promise<{ message: string }> {
  const sessionId = body.sessionId;
  const mode: Mode = body.mode === "rizz" ? "rizz" : "dating_advice";
  const msg = (body.userMessage || "").trim();
  const intent = detectIntent(msg);
  const style = coachStyle(mode);
  const hText = historyText(sessionId);

  const useLLM = process.env.USE_OLLAMA === "true";

  let reply = "";

  if (useLLM) {
    try {
      const raw = await llmAssist({ mode, userMessage: msg, sessionId, intent });
      reply = extractMessage(raw);
      // ensure short, single assistant message
      if (reply) reply = reply.split(/\n{2,}/).map(s => s.trim()).join("\n\n");
    } catch (err) {
      console.warn("llmAssist error:", (err as any)?.message || err);
      reply = "";
    }
  }

  if (!reply) {
    const options = buildQuickReplies(mode, intent);

    const askedForLastMessage =
      alreadyAsked(hText, "Drop the last message") ||
      alreadyAsked(hText, "Send me what they said") ||
      alreadyAsked(hText, "What did they say last");

    if (intent === "reply_help" && askedForLastMessage) {
      reply =
        mode === "rizz"
          ? `${rand(style.openers)}\n\nSend: “I’m down — when you free this week?”`
          : `${rand(style.openers)}\n\nSend: “I’m down — what day works for you this week?”`;
    } else {
      reply = `${rand(style.openers)}\n\n${rand(options)}`;
    }

    if (!askedForLastMessage && intent === "no_reply" && !alreadyAsked(hText, "How long has it been")) {
      reply += `\n\nHow long has it been since they last replied?`;
    }
  }

  const out = clamp(reply || "");
  if (!out) return { message: "Sorry, I couldn't generate a reply right now." };
  return { message: out };
}
