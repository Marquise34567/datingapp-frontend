type Mode = "dating_advice" | "rizz";

function norm(s?: string) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function cap(s: string, n = 260) {
  const out = s.trim();
  return out.length > n ? out.slice(0, n - 1).trim() + "…" : out;
}

function isGreeting(t: string) {
  return ["hi", "hey", "yo", "hello", "wyd", "sup"].includes(t) || t.startsWith("hey ") || t.startsWith("hi ");
}

function oneQuestion(text: string) {
  const idx = text.indexOf("?");
  if (idx === -1) return text;
  return text.slice(0, idx + 1);
}

function coachVoice(mode: Mode) {
  if (mode === "rizz") {
    return {
      opener: "Bet 😌",
      style: (s: string) => s,
    };
  }
  return {
    opener: "Got you.",
    style: (s: string) => s,
  };
}

function detectIntent(msg: string) {
  const t = norm(msg);
  if (isGreeting(t)) return "greeting";
  if (t.includes("left on read") || t.includes("ghost") || t.includes("no reply")) return "no_reply";
  if (t.includes("ask her out") || t.includes("ask him out") || t.includes("date") || t.includes("link")) return "ask_out";
  if (t.includes("mad") || t.includes("argue") || t.includes("fight")) return "conflict";
  if (t.includes("what do i say") || t.includes("what should i say") || t.includes("reply") || t.includes("text")) return "what_to_say";
  if (t.includes("exclusive") || t.includes("what are we")) return "define";
  return "general";
}

export function coachRespond(body: { userMessage: string; mode?: Mode }) {
  const mode: Mode = (body.mode as Mode) || "dating_advice";
  const { opener } = coachVoice(mode);

  const msg = body.userMessage || "";
  const intent = detectIntent(msg);
  const t = norm(msg);

  if (intent === "greeting") {
    return {
      message: cap(`${opener} Tell me what happened + paste the last message. What do you want the outcome to be?`),
    };
  }

  if (intent === "what_to_say") {
    return {
      message: cap(`${opener} Paste what they said (word for word). I’ll write the exact text you should send.`),
    };
  }

  if (intent === "no_reply") {
    const line = mode === "rizz"
      ? `Send: “All good — you still down to link this week?”`
      : `Send: “No worries — still down to hang this week?”`;

    return {
      message: cap(`${opener} Don’t double-text a paragraph.\n\n${line}\n\nHow long has it been since you last texted?`),
    };
  }

  if (intent === "ask_out") {
    const line = mode === "rizz"
      ? `Send: “You free this week? Thu or Sat.”`
      : `Send: “Are you free this week? Thursday or Saturday?”`;

    return {
      message: cap(`${opener} Keep it simple.\n\n${line}\n\nIs this a first link or have y’all already been talking?`),
    };
  }

  if (intent === "conflict") {
    return {
      message: cap(`${opener} Don’t try to win over text.\n\nSend: “I don’t want to argue over text. Can we talk later and reset?”\n\nWhat’s the main thing you want them to understand?`),
    };
  }

  if (intent === "define") {
    const line = mode === "rizz"
      ? `Send: “I’m feeling you… what are we doing?”`
      : `Send: “I like you. Where do you see this going?”`;

    return {
      message: cap(`${opener}\n\n${line}\n\nAre you okay with “casual,” or do you want something real?`),
    };
  }

  const base = mode === "rizz"
    ? `${opener} Tell me the vibe. Paste the last message and I’ll give you a smooth reply.`
    : `${opener} Tell me what happened and paste the last message. I’ll tell you what to say next.`;

  return { message: cap(oneQuestion(base)) };
}
