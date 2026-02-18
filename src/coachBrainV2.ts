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
function clamp(s: string, max = 520) {
  const x = s.trim();
  return x.length > max ? x.slice(0, max - 1).trim() + "…" : x;
}
function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectIntent(tRaw: string): Intent {
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

function historyText(sessionId: string) {
  return getHistory(sessionId).map(x => `${x.role}:${x.text}`).join("\n");
}
function alreadyAsked(h: string, marker: string) {
  return h.includes(marker);
}

function coachStyle(mode: Mode) {
  if (mode === "rizz") {
    return {
      openers: [
        "Say less 😌",
        "Bet — we gon’ play this clean.",
        "Aight, we moving smart.",
        "Cool. No overthinking.",
      ],
      vibeWords: ["smooth", "confident", "playful"],
    };
  }
  return {
    openers: ["Got you.", "Okay — I hear you.", "That’s real.", "I’m with you."],
    vibeWords: ["calm", "direct", "kind"],
  };
}

function buildQuickReplies(mode: Mode, intent: Intent) {
  const dating = {
    greeting: ["What’s the situation?", "Talk to me — what happened?", "What do you need help with?"],
    no_reply: [
      "Send: “All good — you still down to link this week?”",
      "Send: “You been busy? When you free this week?”",
      "Send: “Be real — you still interested or should I fall back?”",
    ],
    ask_out: [
      "Send: “You free Thu or Sat?”",
      "Send: “Let’s do something simple — coffee this week?”",
      "Send: “I’d like to see you. When are you free?”",
    ],
    reply_help: [
      "Send me what they said + what you want, I’ll write the exact reply.",
      "What did they say last, and what outcome do you want?",
      "Drop the last message — I’ll craft a 1–2 sentence reply.",
    ],
    define: [
      "Send: “I like you — are we building or keeping it casual?”",
      "Send: “I’m not into guessing. Where’s your head at?”",
      "Send: “What are we doing here? I want clarity.”",
    ],
    conflict: [
      "Send: “I don’t want to argue over text. Let’s talk later and reset.”",
      "Send: “I hear you — I want us good. We can talk when it’s calm.”",
      "Send: “I care, but I’m not doing disrespect. Let’s talk properly.”",
    ],
    breakup: [
      "Okay… protect your peace. Don’t send a paragraph.",
      "We can handle this with dignity. Do you want closure or to move on?",
      "Do you want to try to fix it — or are you done?",
    ],
    apology: [
      "Keep it simple: acknowledge, take responsibility, change the behavior.",
      "Send: “You’re right — that was on me. I’m sorry. It won’t happen again.”",
      "What are you apologizing for exactly? I’ll make it clean.",
    ],
    flirt: [
      "Send: “You got a vibe. When you free?”",
      "Send: “I can’t lie — you’re cute. What you doing this week?”",
      "Send: “I’m tryna take you out. Pick a day.”",
    ],
    general: [
      "Tell me what happened in one sentence — I’ll tell you what to text.",
      "What’s the goal: get a date, get clarity, or fall back?",
      "Give me the last message + your goal.",
    ],
  };

  const rizz = {
    greeting: ["Yo 😌 what’s the play?", "Talk to me. What happened?", "What we fixing today?"],
    no_reply: [
      "Send: “You alive? 😭 When you free?”",
      "Send: “All good — you still tryna link or nah?”",
      "Send: “I’m not chasing. You in or you out?”",
    ],
    ask_out: [
      "Send: “I’m tryna see you. Thu or Sat?”",
      "Send: “Let’s keep it simple — when you free?”",
      "Send: “I’m taking you out. Pick a day.”",
    ],
    reply_help: [
      "Drop what they said — I’ll cook a smooth one-liner.",
      "What’d they say + what vibe you want (playful / serious / bold)?",
      "Send the last message — I’ll write the reply.",
    ],
    define: [
      "Send: “Be real — what is this?”",
      "Send: “You still rocking with me or nah?”",
      "Send: “I’m feeling you… you on the same page?”",
    ],
    conflict: [
      "Send: “I’m not arguing over text. We’ll talk later.”",
      "Send: “I hear you. Let’s reset later.”",
      "Send: “We can talk when it’s calm.”",
    ],
    breakup: [
      "Don’t send a novel. Keep your dignity.",
      "Do you want closure or peace?",
      "Are you trying to fix it or move on?",
    ],
    apology: [
      "Send: “You right — that was my bad. I’m sorry. I’ll do better.”",
      "Short + real wins. No excuses.",
      "What exactly happened?",
    ],
    flirt: [
      "Send: “You look good… what you doing this week?”",
      "Send: “I can’t lie — you’re my type. You down?”",
      "Send: “I’m tryna take you out. When can I see you?”",
    ],
    general: [
      "Tell me what happened. I’ll tell you what to text.",
      "What’s the vibe — flirty, serious, or messy?",
      "Drop the last message.",
    ],
  };

  return mode === "rizz" ? (rizz as any)[intent] || rizz.general : (dating as any)[intent] || dating.general;
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

  const system = `
You are a premium dating coach in 2026. You sound human, not robotic.
Rules:
- Keep replies SHORT: 2–5 lines max.
- Always give an exact message the user can send (1–2 sentences).
- No long lists, no lectures, no therapy-speak.
- If info is missing, ask only ONE question.
- Be candid, confident, and kind. No insults.
- If user asks for manipulation/harassment, redirect to respectful options.
Mode: ${mode}. Intent: ${intent}.
`.trim();

  const user = `
Conversation so far:
${transcript}

New user message:
${userMessage}

Write the coach reply now.
`.trim();

  const model = process.env.OLLAMA_MODEL || "llama3.1";
  // Prefer low temperature for consistent short replies from local LLM
  const raw = await ollamaChat({ model, system, user, temperature: 0.25 });
  // Clean up common quoting and whitespace
  return raw.replace(/^\s*["“”]+|["“”]+\s*$/g, "").trim();
}

export async function coachBrainV2(body: {
  sessionId: string;
  userMessage: string;
  mode?: Mode;
}) {
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
      reply = await llmAssist({ mode, userMessage: msg, sessionId, intent });
      // ensure short, single assistant message
      if (reply) reply = reply.split(/\n{2,}/).map(s => s.trim()).join("\n\n");
    } catch (err) {
      console.warn("llmAssist error:", err?.message || err);
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

  return { message: clamp(reply) };
}
