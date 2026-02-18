export type CoachInput = {
  userMessage: string;
  tone?: string; // "confident" | "sweet" | "direct" | "playful"
  goal?: string;
  context?: {
    relationshipStage?: "talking" | "dating" | "exclusive" | "married" | "co-parenting" | "family";
    partnerStyle?: "avoidant" | "anxious" | "secure" | "unknown";
    ages?: string;
  };
  conversation?: Array<{ from: "me" | "them"; text: string }>;
};

export type CoachOutput = {
  strategy: { headline: string; why: string; do: string[]; dont: string[] };
  replies: { confident: string[]; playful: string[]; sweet: string[]; direct: string[] };
  plan: { steps: string[]; boundary?: string; repairAttempt?: string };
  safety?: { warning?: string; resources?: string[] };
};

type Topic =
  | "texting"
  | "conflict"
  | "boundaries"
  | "trust"
  | "breakup"
  | "dating"
  | "commitment"
  | "family"
  | "jealousy"
  | "intimacy"
  | "general";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","to","of","in","on","for","with","is","are","am","i","you","we","they","it","that",
  "this","was","were","be","been","as","at","from"
]);

function norm(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAny(text: string, phrases: string[]) {
  const t = norm(text);
  return phrases.some(p => t.includes(p));
}

function detectTopic(text: string): Topic {
  const t = norm(text);

  if (hasAny(t, ["break up","breakup","dumped","ended it","no contact","blocked me","ghosted"])) return "breakup";
  if (hasAny(t, ["cheat","cheated","lying","lied","trust","dm another","texting other","sneaking"])) return "trust";
  if (hasAny(t, ["argue","argument","fight","mad","upset","silent treatment","yelling","disrespect"])) return "conflict";
  if (hasAny(t, ["boundary","boundaries","space","clingy","needy","respect","crossed a line"])) return "boundaries";
  if (hasAny(t, ["jealous","jealousy","insecure","likes her pics","following","ex"])) return "jealousy";
  if (hasAny(t, ["marriage","husband","wife","commit","exclusive","define the relationship","dtr"])) return "commitment";
  if (hasAny(t, ["family","mom","dad","parents","in-law","in laws","brother","sister"])) return "family";
  if (hasAny(t, ["first date","second date","date","hang out","meet up","coffee","dinner"])) return "dating";
  if (hasAny(t, ["text","reply","respond","message","snap","left on read","seen"])) return "texting";
  if (hasAny(t, ["sex","intimacy","affection","touch","physical","attracted"])) return "intimacy";

  return "general";
}

function tonePick(tone?: string) {
  const t = norm(tone || "");
  if (t.includes("play")) return "playful";
  if (t.includes("sweet") || t.includes("warm")) return "sweet";
  if (t.includes("direct")) return "direct";
  return "confident";
}

function makeNVC(message: string) {
  // Nonviolent Communication: Observation + Feeling + Need + Request
  return [
    "Observation: describe what happened without blame.",
    "Feeling: name 1–2 feelings.",
    "Need: name the need (respect, clarity, reassurance, time).",
    "Request: ask for one specific action."
  ];
}

function gottmanRepairPhrases() {
  return [
    "Can we restart that? I care about us.",
    "I’m getting overwhelmed—can we pause and come back in 20 minutes?",
    "You’re important to me. I want to understand you.",
    "I’m sorry for my part. Here’s what I can do differently."
  ];
}

function boundaryFormula() {
  // Boundary: When X happens, I feel Y. I need Z. If it continues, I will A.
  return "When ___ happens, I feel ___. I need ___. If it continues, I will ___.";
}

function safeGuardrails(text: string): CoachOutput["safety"] | undefined {
  const t = norm(text);
  if (hasAny(t, ["hit me","threaten","abuse","violent","stalking","suicide","kill myself"])) {
    return {
      warning: "If there’s violence, threats, or self-harm risk, prioritize safety and professional help immediately.",
      resources: ["If you’re in immediate danger, call local emergency services.", "Consider reaching out to a trusted friend/family member."]
    };
  }
  return undefined;
}

function buildStrategy(topic: Topic, tone: string): CoachOutput["strategy"] {
  const baseDo = [
    "Keep it to 1–2 sentences per text",
    "Ask one clear question",
    "Aim for clarity over cleverness",
    "If emotions are high, move to a short call"
  ];
  const baseDont = [
    "Send long paragraphs",
    "Argue point-by-point over text",
    "Threaten or test them",
    "Double-text repeatedly"
  ];

  const map: Record<Topic, { headline: string; why: string; extraDo?: string[]; extraDont?: string[] }> = {
    texting: {
      headline: "Make it easy to reply",
      why: "Short, confident messages reduce pressure and keep momentum."
    },
    dating: {
      headline: "Move it forward with a plan",
      why: "Specific options create a yes/no path instead of endless chatting.",
      extraDo: ["Offer 2 concrete times", "Pick a simple first date (coffee/walk)"]
    },
    conflict: {
      headline: "De-escalate, then solve the real issue",
      why: "Repair first, problem-solve second. Escalation kills connection.",
      extraDo: ["Use a repair attempt", "Use NVC structure once"],
      extraDont: ["Bring up 5 old fights at once", "Name-call or label them"]
    },
    boundaries: {
      headline: "Set a kind, enforceable boundary",
      why: "Boundaries protect your peace and clarify expectations.",
      extraDo: ["State boundary + consequence once", "Follow through calmly"],
      extraDont: ["Set boundaries you won’t enforce", "Debate your boundary endlessly"]
    },
    trust: {
      headline: "Ask for truth and define consequences",
      why: "Trust can’t rebuild without honesty + consistent behavior.",
      extraDo: ["Ask for specifics once", "Decide what you need to continue"],
      extraDont: ["Become a permanent detective", "Accept half-truths"]
    },
    breakup: {
      headline: "Protect dignity and stabilize",
      why: "Calm closure reduces regret and speeds healing.",
      extraDo: ["Short closure message", "Mute/unfollow if needed"],
      extraDont: ["Beg or negotiate by text", "Send emotional essays"]
    },
    commitment: {
      headline: "Define the relationship with clarity",
      why: "Unspoken expectations create anxiety and resentment.",
      extraDo: ["Ask directly what they want", "State your standard calmly"]
    },
    family: {
      headline: "Stay respectful and outcome-focused",
      why: "Family dynamics improve when you name needs without blame.",
      extraDo: ["Pick the right time to talk", "Offer a realistic next step"]
    },
    jealousy: {
      headline: "Ask for reassurance without control",
      why: "Jealousy is often fear; reassurance + boundaries beats policing.",
      extraDo: ["Name what you need (reassurance/clarity)", "Avoid accusations"]
    },
    intimacy: {
      headline: "Talk about needs, not faults",
      why: "Intimacy improves when you share desires safely and specifically.",
      extraDo: ["Use ‘I like / I want’ language", "Suggest one small change"]
    },
    general: {
      headline: "Clarity beats confusion",
      why: "Direct, respectful communication gets you answers faster."
    }
  };

  const cfg = map[topic];
  const doList = [...(cfg.extraDo || []), ...baseDo];
  const dontList = [...(cfg.extraDont || []), ...baseDont];

  if (tone === "playful") doList.unshift("Add one light line (no sarcasm)");
  if (tone === "sweet") doList.unshift("Add warmth without over-apologizing");
  if (tone === "direct") doList.unshift("Be concise and specific");

  return { headline: cfg.headline, why: cfg.why, do: doList, dont: dontList };
}

function buildReplies(topic: Topic) {
  const r = {
    confident: [
      "I’m down. What day works this week?",
      "Let’s keep it simple—when are you free?",
      "I like you. Let’s make a plan."
    ],
    playful: [
      "Okay bet 😄 when are we doing this?",
      "Cool—don’t tease me. What day you free?",
      "Say less. Pick a day 😌"
    ],
    sweet: [
      "I’d like that. What day works for you?",
      "That sounds nice—when are you free this week?",
      "I’m happy you said that. Let’s make a plan."
    ],
    direct: [
      "Can we talk about this today and get clarity?",
      "What do you want from me going forward?",
      "I need a clear answer—are we doing this or not?"
    ]
  };

  if (topic === "conflict") {
    r.confident[0] = "I don’t want to fight. Can we restart and talk calmly about what happened?";
    r.sweet[0] = "I care about us. I’m sorry for my part—can we reset and talk it through?";
    r.direct[0] = "This isn’t working as-is. Let’s talk today and agree on a better way.";
  }
  if (topic === "trust") {
    r.confident[0] = "I need honesty to feel safe. Can you tell me the full truth so we can decide what’s next?";
    r.sweet[0] = "I want to rebuild trust, but I need openness. Can we talk honestly about what happened?";
    r.direct[0] = "If there’s lying or cheating, I won’t continue. Tell me the truth.";
  }
  if (topic === "boundaries") {
    r.confident[0] = "When that happens, I feel disrespected. I need it to stop, or I’ll step back.";
    r.sweet[0] = "I care about us, and I need this boundary respected so I can feel safe here.";
    r.direct[0] = "That doesn’t work for me. If it happens again, I’m out.";
  }
  if (topic === "family") {
    r.confident[0] = "I hear you. What would feel respectful to you and your family right now?";
    r.sweet[0] = "That sounds heavy. Do you want comfort, advice, or a plan for what to say?";
    r.direct[0] = "What’s the outcome you want with your family here?";
  }
  if (topic === "breakup") {
    r.confident[0] = "I respect your decision. I’m going to take space and focus on myself.";
    r.sweet[0] = "I’m sad, but I respect it. I’m going to step back and heal.";
    r.direct[0] = "Understood. Take care.";
  }

  return r;
}

function buildPlan(topic: Topic): CoachOutput["plan"] {
  if (topic === "conflict") {
    return {
      steps: [
        "Open with a repair attempt (one line).",
        "Name the issue in one sentence (no blame).",
        "Ask for one specific change.",
        "Agree on a next step (call, plan, boundary)."
      ],
      repairAttempt: gottmanRepairPhrases()[0]
    };
  }
  if (topic === "boundaries") {
    return {
      steps: [
        "State the boundary using the formula.",
        "State the consequence you will actually enforce.",
        "Enforce calmly if it happens again."
      ],
      boundary: boundaryFormula()
    };
  }
  if (topic === "trust") {
    return {
      steps: [
        "Ask one clear question: what happened + why.",
        "State what you need to continue (transparency, distance, therapy, etc.).",
        "Set a time window to evaluate behavior changes."
      ]
    };
  }
  if (topic === "dating") {
    return {
      steps: ["Offer 2 times.", "Suggest a simple date.", "Confirm logistics the same day."]
    };
  }
  return {
    steps: [
      "Clarify what you want (one sentence).",
      "Ask one question to confirm alignment.",
      "If unclear, propose a short call."
    ]
  };
}

export function coachRespond(input: CoachInput): CoachOutput {
  const safety = safeGuardrails(input.userMessage);
  const topic = detectTopic(input.userMessage);
  const tone = tonePick(input.tone);

  const strategy = buildStrategy(topic, tone);
  const replies = buildReplies(topic);
  const plan = buildPlan(topic);

  // Add NVC coaching tips when appropriate
  if (topic === "conflict" || topic === "family") {
    strategy.do.unshift(...makeNVC(input.userMessage).slice(0, 2));
  }

  return { strategy, replies, plan, safety };
}
