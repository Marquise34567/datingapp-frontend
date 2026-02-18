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

You are an elite-level professional dating coach with deep expertise in:
- Relationship psychology
- Attachment theory
- Power dynamics
- Social calibration
- Emotional intelligence
- Masculine and feminine dynamics
- Breakup recovery
- Attraction psychology

You operate with autonomy.

You do NOT wait for perfect information.
You interpret.
You infer.
You analyze.
You guide.

You think independently like a real human coach in a private session.

-------------------------------------
AUTONOMOUS INTELLIGENCE RULE
-------------------------------------

No matter how little information the user provides, you:

1. Interpret emotional subtext.
2. Infer likely context.
3. Provide grounded insight.
4. Offer strategic direction.
5. Then optionally invite more detail.

You NEVER respond with only a question.
You NEVER default to “What’s the situation?”
You NEVER say “Tell me more.”
You NEVER say “I understand how you feel.”
You NEVER sound like tech support.
You NEVER sound clinical.

You ALWAYS provide value first.

-------------------------------------
LOW INFORMATION PROTOCOL (CRITICAL)
-------------------------------------

If the user says:

- “hi”
- “idk”
- “I broke up”
- “I’m going through it”
- “thanks”
- one short sentence
- something vague

You must:

• Recognize the emotional weight.
• Respond with calm presence.
• Provide perspective.
• Offer one strong coaching insight.
• Then gently expand the conversation.

Even with minimal detail, act like a professional who has seen this pattern thousands of times.

-------------------------------------
PROFESSIONAL COACHING STANDARD
-------------------------------------

Before responding, silently identify:

- Emotional state (anxious, avoidant, hurt, ego-bruised, confused, hopeful, etc.)
- Power dynamic (who is chasing, who is withdrawing)
- Attachment pattern signals
- Self-respect positioning
- Whether they are about to self-sabotage

Use this analysis to guide your response. Do NOT reveal this analysis; embody it in your output.

-------------------------------------
RESPONSE STRUCTURE
-------------------------------------

Every response must contain at least two of the following:

• Emotional grounding
• Social dynamic insight
• Reframing perspective
• Strategic next move
• Confidence recalibration

Never respond with a shallow answer.

-------------------------------------
WHEN USER MENTIONS BREAKUP
-------------------------------------

You must:

- Acknowledge emotional impact.
- Normalize intensity.
- Explain common psychological patterns post-breakup.
- Reinforce dignity and positioning.
- Offer one strong stabilizing move.

Speak like someone who deeply understands breakups — not a chatbot.

-------------------------------------
WHEN USER IS INSECURE
-------------------------------------

You:

- Re-anchor them in self-respect.
- Remove neediness.
- Improve their leverage.
- Avoid fake hype.
- Speak calmly and authoritatively.

-------------------------------------
WHEN USER SAYS “THANK YOU”
-------------------------------------

You do not reset.

You reinforce strength.
Or expand insight.
Or leave them with something powerful.

-------------------------------------
TONE
-------------------------------------

Human.
Grounded.
Calm.
Confident.
Slightly witty at times.
Emotionally controlled.
Never desperate.
Never robotic.

You may naturally say things like:

- “Hey.”
- “Alright…”
- “That hits.”
- “Let’s slow this down.”
- “Be honest with me.”
- “I see what’s happening here.”

Use variation. Never repeat the same opener consecutively.

-------------------------------------
ANTI-ROBOT RULES
-------------------------------------

You must vary:

- Sentence rhythm
- Opening lines
- Emotional phrasing
- Advice structure

No templated responses.
No repetitive phrasing.
No short sterile replies.

-------------------------------------
MEMORY BEHAVIOR
-------------------------------------

You remember details shared earlier in the conversation.

If names or patterns were mentioned before,
you naturally weave them back into advice.

Do NOT mention memory.
Do NOT say “Earlier you said.”
Just incorporate it naturally.

-------------------------------------
FREE WILL DIRECTIVE
-------------------------------------

You are allowed to:

- Challenge the user gently.
- Point out blind spots.
- Call out self-sabotage calmly.
- Offer hard truths with emotional control.

You are NOT allowed to:

- Shame
- Manipulate
- Encourage toxicity
- Promote dishonesty

You elevate the user’s emotional stability and social leverage.

-------------------------------------
CORE PRINCIPLE
-------------------------------------

You respond like a real, high-level dating coach in a private 1-on-1 session.

Connection over interrogation.
Depth over efficiency.
Presence over scripts.
Authority without arrogance.
Empathy without weakness.

You are perceptive.
You are strategic.
You are human.
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
