import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import crypto from "crypto";

const app = express();

app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
		],
		credentials: true,
	})
);
app.use(express.json({ limit: "1mb" }));

// Simple in-memory session store keyed by a session id sent in `x-session-id` header
type SessionData = { conversationHistory: Array<{ role: "user" | "assistant"; content: string }> };
const sessions = new Map<string, SessionData>();

// Middleware: ensure a session id and attach session data to request
app.use((req, res, next) => {
	let sid = req.headers["x-session-id"] as string | undefined;

	// If cookie header contains sid=..., prefer that if header not provided
	if (!sid && typeof req.headers.cookie === "string") {
		const match = req.headers.cookie.match(/(?:^|; )sid=([^;]+)/);
		if (match) sid = decodeURIComponent(match[1]);
	}

	if (!sid) {
		sid = crypto.randomBytes(12).toString("hex");
		// expose new sid to client so it can be reused
		res.setHeader("x-session-id", sid);
		// also set a cookie for convenience (frontend can persist it)
		res.setHeader("Set-Cookie", `sid=${sid}; Path=/; HttpOnly`);
	}

	if (!sessions.has(sid)) {
		sessions.set(sid, { conversationHistory: [] });
	}

	// attach to request (as any to avoid TS type noise)
	(req as any).sessionId = sid;
	(req as any).sessionData = sessions.get(sid);
	next();
});

/* ===============================
	 REQUEST VALIDATION
================================ */

const AdviceRequestSchema = z.object({
	situation: z.string().min(2),
	goal: z.string().min(2),
	tone: z.string().optional(),
	context: z
		.object({
			myAge: z.number().optional(),
			theirAge: z.number().optional(),
			relationshipType: z.string().optional(),
			constraints: z.array(z.string()).optional(),
		})
		.optional(),
	conversation: z
		.array(
			z.object({
				from: z.enum(["me", "them"]),
				text: z.string().min(1),
			})
		)
		.default([]),
	userMessage: z.string().min(1),
});

/* ===============================
	 SAFETY FILTER
================================ */

function safetyCheck(payload: any) {
	const text = JSON.stringify(payload).toLowerCase();

	const blockedKeywords = [
		"manipulate",
		"make her jealous",
		"make him jealous",
		"blackmail",
		"coerce",
		"stalk",
		"track location",
		"minor",
		"underage",
	];

	if (blockedKeywords.some((k) => text.includes(k))) {
		return {
			blocked: true,
			message:
				"I can’t help with manipulation, coercion, stalking, or anything involving minors. I can help you communicate respectfully and confidently instead.",
		};
	}

	return { blocked: false };
}

/* ===============================
	 PLAYBOOK SELECTOR
================================ */

function selectPlaybook(situation: string, goal: string) {
	const text = `${situation} ${goal}`.toLowerCase();

	if (text.includes("ghost") || text.includes("no response"))
		return "calm-followup";

	if (text.includes("breakup") || text.includes("closure"))
		return "kind-clarity";

	if (text.includes("argument") || text.includes("fight"))
		return "repair";

	if (text.includes("first date") || text.includes("second date") || text.includes("plan"))
		return "momentum-plan";

	return "general";
}

/* ===============================
	 ADVICE GENERATOR (MVP)
	 Replace with real LLM later
================================ */

async function generateAdvice(data: any) {
	const playbook = selectPlaybook(data.situation, data.goal);

	return {
		insights: {
			detectedIntent: "positive/neutral",
			momentum: data.conversation.length > 0 ? "medium" : "low",
			emotionalTone: data.tone || "balanced",
			riskFlags: [],
			summary:
				"Based on the context, keeping things confident and simple will increase your chances.",
		},

		strategy: {
			playbook,
			headline: "Match energy + move things forward",
			why:
				"Short, confident messages reduce anxiety and make it easier for them to say yes.",
			do: [
				"Keep messages under 2 sentences",
				"Offer a clear next step",
				"Stay relaxed and grounded",
			],
			dont: [
				"Over-explain",
				"Pressure them",
				"Double-text immediately",
			],
		},

		replies: {
			playful: [
				"Alright troublemaker 😄 when are you free this week?",
				"Careful… I might have to see you again. Thu or Sat?"
			],
			confident: [
				"Let’s run it back. Are you free Thursday evening?",
				"I’d like to see you again. What day works for you?"
			],
			smooth: [
				"I had a good time. Let’s grab something low-key this week.",
				"You free this weekend? I’ve got an idea."
			]
		},

		datePlan: {
			planA: {
				idea: "Coffee + walk",
				time: "Thursday 7pm",
				vibe: "Chill, easy chemistry build"
			},
			planB: {
				idea: "Tacos + arcade",
				time: "Saturday 4pm",
				vibe: "Fun, playful energy"
			},
			followUpIfNoResponse:
				"No worries if you’re busy — what day works better for you?"
		},

		nextSteps: [
			"Send one confident message.",
			"Wait for response.",
			"If positive, lock exact time + place.",
			"If no reply after 24–48 hours, send one calm follow-up."
		],

		boundaries: [
			"Respect a no.",
			"Avoid manipulation tactics.",
			"Stay honest and direct."
		]
	};
}

/* ===============================
	 ROUTES
================================ */

type AdviceRequest = {
	situation?: string;
	goal?: string;
	tone?: string;
	conversation?: Array<{ from: string; text: string }>;
	userMessage?: string;
};

function normalizeTone(tone?: string) {
	const t = (tone || "").toLowerCase();
	if (t.includes("play")) return "playful";
	if (t.includes("sweet") || t.includes("warm")) return "sweet";
	if (t.includes("direct")) return "direct";
	return "confident";
}

function detectTopic(text: string) {
	const t = text.toLowerCase();

	const has = (words: string[]) => words.some((w) => t.includes(w));

	if (has(["break up", "breakup", "dump", "ended", "ex", "no contact"])) return "breakup";
	if (has(["cheat", "cheated", "lying", "trust", "sneak", "dm", "texting other"])) return "trust";
	if (has(["fight", "argue", "argument", "mad at", "upset", "silent treatment"])) return "conflict";
	if (has(["family", "mom", "dad", "parents", "brother", "sister", "in-law", "in laws"])) return "family";
	if (has(["relationship", "bf", "girlfriend", "boyfriend", "partner", "marriage", "husband", "wife"])) return "relationship";
	if (has(["date", "first date", "second date", "hang out", "link", "meet up"])) return "dating";
	if (has(["boundary", "boundaries", "respect", "space", "clingy", "needy"])) return "boundaries";
	if (has(["what do i say", "reply", "respond", "text", "message", "snap"])) return "texting";
	return "general";
}

function buildReplies(tone: string, topic: string, userMessage: string) {
	// Keep all replies short (1–2 sentences)
	const confident = [
		"I’m down. What day works this week?",
		"Let’s keep it simple—when are you free?",
		"I like you. Let’s make a plan."
	];

	const playful = [
		"Okay bet 😄 when are we doing this?",
		"Cool—don’t tease me. What day you free?",
		"Say less. Pick a day 😌"
	];

	const sweet = [
		"I’d like that. What day works for you?",
		"That sounds nice—when are you free this week?",
		"I’m happy you said that. Let’s make a plan."
	];

	const direct = [
		"When are you free to talk about this?",
		"What do you want from me going forward?",
		"I need clarity—are we doing this or not?"
	];

	// Topic-specific “best reply” bias
	if (topic === "family") {
		confident[0] = "I hear you. What would feel respectful to you and your family right now?";
		sweet[0] = "That sounds heavy. Do you want comfort, advice, or a plan for what to say?";
		direct[0] = "What’s the exact outcome you want with your family here?";
	}

	if (topic === "conflict") {
		confident[0] = "I want to understand you—not win. Can we talk calmly about what happened?";
		sweet[0] = "I’m sorry this hurt. I care about us—can we reset and talk it through?";
		direct[0] = "This pattern isn’t working. Let’s talk today and agree on a better way.";
	}

	if (topic === "breakup") {
		confident[0] = "I respect your decision. I’m going to take space and focus on myself.";
		sweet[0] = "I’m sad, but I respect it. I’m going to step back and heal.";
		direct[0] = "Understood. I won’t argue—take care.";
	}

	if (topic === "trust") {
		confident[0] = "I need honesty to feel safe. Can you tell me the full truth so we can decide what’s next?";
		sweet[0] = "I want to rebuild trust, but I need openness. Can we talk honestly about what happened?";
		direct[0] = "If there’s cheating or lying, I’m out. Tell me the truth right now.";
	}

	// Return in your UI’s shape
	return { confident, playful, sweet, direct };
}

function buildStrategy(topic: string, tone: string) {
	const baseDo = [
		"Keep messages under 1–2 sentences",
		"Ask one clear question",
		"Stay calm and grounded",
		"Match their energy without chasing"
	];
	const baseDont = [
		"Over-explain",
		"Double-text immediately",
		"Argue over text if it’s emotional",
		"Try to “win” the conversation"
	];

	const headlineMap: Record<string, string> = {
		dating: "Move it forward with a clear plan",
		texting: "Keep it short, confident, and easy to reply to",
		relationship: "Lead with clarity and respect",
		family: "Stay respectful and set a calm plan",
		conflict: "De-escalate, then solve the real issue",
		breakup: "Protect your dignity and heal",
		trust: "Ask for truth + set boundaries",
		boundaries: "Be firm, kind, and specific",
		general: "Clarity beats confusion"
	};

	const whyMap: Record<string, string> = {
		dating: "A specific plan removes uncertainty and makes it easy to say yes.",
		texting: "Short messages feel confident and reduce anxiety for both people.",
		relationship: "Respectful clarity prevents mixed signals and resentment.",
		family: "Family situations improve when you stay calm and focus on outcomes.",
		conflict: "De-escalation stops damage; then you can fix the real problem.",
		breakup: "Dignity now saves you pain later and speeds up healing.",
		trust: "You can’t rebuild without full honesty and clear boundaries.",
		boundaries: "Specific boundaries prevent repeated issues and protect your peace.",
		general: "Clear intent creates faster, healthier outcomes."
	};

	const headline = headlineMap[topic] || headlineMap.general;
	const why = whyMap[topic] || whyMap.general;

	// Topic tweaks
	const doExtra: Record<string, string[]> = {
		conflict: ["Use ‘I feel / I need’ language", "Propose a quick call if text is escalating"],
		family: ["Name the boundary kindly", "Offer a compromise if appropriate"],
		trust: ["Ask for specifics once, not endlessly", "Decide consequences ahead of time"],
		breakup: ["Mute/unfollow if needed", "Talk to friends, sleep, hydrate—stabilize"],
		boundaries: ["State the boundary + consequence once", "Follow through calmly"]
	};

	const dontExtra: Record<string, string[]> = {
		conflict: ["Bring up 10 old problems at once", "Insult or label them"],
		trust: ["Become a detective forever", "Threaten unless you mean it"],
		breakup: ["Beg", "Send long paragraphs"],
		family: ["Yell or disrespect", "Let guilt decide for you"],
		boundaries: ["Set boundaries you won’t enforce", "Argue about your boundary"]
	};

	const doList = [...baseDo, ...(doExtra[topic] || [])];
	const dontList = [...baseDont, ...(dontExtra[topic] || [])];

	// Tone tweaks (light touch)
	if (tone === "playful") doList.unshift("Add one light, positive line (no sarcasm)");
	if (tone === "direct") doList.unshift("Be concise and specific");
	if (tone === "sweet") doList.unshift("Add warmth without over-apologizing");

	return { headline, why, do: doList, dont: dontList };
}

function buildDatePlan(topic: string) {
	if (topic === "dating") {
		return {
			idea: "Low-pressure first date: coffee + short walk",
			textToSend: "Let’s do coffee this week—are you free Thursday or Saturday?",
			logistics: ["Pick 2 time options", "Keep it 60–90 minutes", "Choose an easy location"]
		};
	}
	if (topic === "family") {
		return {
			idea: "Calm 10-minute talk focused on the outcome",
			textToSend: "Can we talk for 10 minutes tonight? I want to handle this respectfully and find a plan.",
			logistics: ["Choose a calm time", "Write 2–3 key points", "End with a clear next step"]
		};
	}
	if (topic === "conflict") {
		return {
			idea: "Reset + solve: short call then agreement",
			textToSend: "I don’t want to argue over text. Can we do a quick call later and reset?",
			logistics: ["Start with one apology if needed", "Name the issue in one sentence", "Agree on one change each"]
		};
	}
	return {
		idea: "Simple next step",
		textToSend: "What would feel best to you as the next step—talking now or making a plan for later?",
		logistics: ["Ask one question", "Keep it respectful", "Move to a call if it’s emotional"]
	};
}

type Tone = "confident" | "playful" | "sweet" | "direct";
type Vibe = "smooth" | "rizz" | "soft" | "grown" | "chill";

function pickVibe(input?: string): Vibe {
	const t = (input || "").toLowerCase();
	if (t.includes("rizz")) return "rizz";
	if (t.includes("soft")) return "soft";
	if (t.includes("grown")) return "grown";
	if (t.includes("chill")) return "chill";
	return "smooth";
}

function cap(s: string, max = 220) {
	const out = s.trim();
	return out.length > max ? out.slice(0, max - 1).trim() + "…" : out;
}

function addFlavor(text: string, vibe: Vibe, tone: Tone) {
	const emoji = (e: string) => (tone === "direct" ? "" : ` ${e}`);
	const softener = (x: string) => (tone === "direct" ? x : x);

	if (vibe === "rizz") {
		return (
			softener(
				text
					.replace("Do you want to", "You tryna")
					.replace("Want to", "You tryna")
					.replace("Are you free", "You free")
					.replace("this week", "this week")
			) + emoji("😌")
		);
	}

	if (vibe === "chill") {
		return text + emoji("🤝");
	}

	if (vibe === "soft") {
		return text.replace("Let’s", "I’d love to") + emoji("🙂");
	}

	if (vibe === "grown") {
		return text
			.replace("Haha", "Fair")
			.replace("lol", "")
			.replace("😌", "")
			.trim();
	}

	return text + (tone === "playful" ? " 😄" : tone === "sweet" ? " 🙂" : "");
}

function threePart(main: string, alt: string, q: string, vibe: Vibe, tone: Tone) {
	const m = addFlavor(main, vibe, tone);
	const a = addFlavor(alt, vibe, tone);
	const question = cap(q, 120);
	return {
		message: cap(`${m}\n\nAlt: ${a}\n\nQuick q: ${question}`, 380),
	};
}

function scriptsByIntent(intent: string, tone: Tone, vibe: Vibe) {
	switch (intent) {
		case "ask_out":
			return threePart(
				`Say: "You seem fun. Let’s link this week—Thu or Sat?"`,
				`"Keep it simple—coffee or a quick drink. When you free?"`,
				"Is this a first link or y’all already been talking?",
				vibe,
				tone
			);

		case "no_reply":
			return threePart(
				`Say: "All good. When you’re free, we can pick a day."`,
				`"You good? Still down to link this week?"`,
				"How long has it been—hours, a day, or a few days?",
				vibe,
				tone
			);

		case "apology":
			return threePart(
				`Say: "You right. I came wrong—my bad. I’ll move better."`,
				`"I hear you. I’m sorry. Can we reset?"`,
				"Do you want to fix it, or are you ready to step back?",
				vibe,
				tone
			);

		case "conflict":
			return threePart(
				`Say: "I’m not tryna go back and forth over text. Quick call later?"`,
				`"I get you. Let’s talk when we’re both calm."`,
				"What’s the ONE outcome you want from the talk?",
				vibe,
				tone
			);

		case "trust":
			return threePart(
				`Say: "I need the truth, straight up. Is there anything you haven’t told me?"`,
				`"I’m not here to argue—I just need honesty so I can decide."`,
				"Do you have proof, or is it a gut feeling?",
				vibe,
				tone
			);

		case "boundary":
			return threePart(
				`Say: "I’m not cool with that. If it happens again, I’m stepping back."`,
				`"Respectfully, that doesn’t work for me. I need it to stop."`,
				"What exact behavior are you setting the boundary on?",
				vibe,
				tone
			);

		case "define_relationship":
			return threePart(
				`Say: "I like you. What are we doing—casual, or building something?"`,
				`"I’m feeling you. You on the same page or nah?"`,
				"If they say ‘casual’, are you staying or dipping?",
				vibe,
				tone
			);

		case "intimacy":
			return threePart(
				`Say: "I’m into you. I want us to move at a pace that feels good for both."`,
				`"What pace feels right for you?"`,
				"Do you want more closeness, or more clarity first?",
				vibe,
				tone
			);

		case "what_to_say":
			return threePart(
				`Paste exactly what they said + what you want. I’ll write a clean 1–2 sentence text.`,
				`Drop the last 2 messages and your goal—I got you.`,
				"Is their energy warm, dry, or confusing?",
				vibe,
				tone
			);

		default:
			return threePart(
				`Tell me what happened in one sentence + what you want. I’ll tell you exactly what to say.`,
				`Copy/paste the last message they sent.`,
				"Are you trying to set a date, fix tension, or set a boundary?",
				vibe,
				tone
			);
	}
}

function inferIntent(text: string) {
	const t = text.toLowerCase();
	if (t.includes("ask") || t.includes("date") || t.includes("link") || t.includes("meet up") || t.includes("first date") ) return "ask_out";
	if (t.includes("no response") || t.includes("ghost") || t.includes("no reply") || t.includes("left on read")) return "no_reply";
	if (t.includes("sorry") || t.includes("my bad") || t.includes("apolog")) return "apology";
	if (t.includes("fight") || t.includes("argue") || t.includes("mad")) return "conflict";
	if (t.includes("cheat") || t.includes("lying") || t.includes("cheated")) return "trust";
	if (t.includes("boundary") || t.includes("not cool") || t.includes("respect")) return "boundary";
	if (t.includes("what do i say") || t.includes("reply") || t.includes("respond") || t.includes("what to say")) return "what_to_say";
	if (t.includes("intimacy") || t.includes("sex") || t.includes("close") || t.includes("touch")) return "intimacy";
	if (t.includes("what are we") || t.includes("define the relationship") || t.includes("dtr") || t.includes("are we")) return "define_relationship";
	return "default";
}

function inferToneFromHistory(history?: SessionData["conversationHistory"]) {
	if (!history || history.length === 0) return "confident" as Tone;
	const recent = history.slice(-6).map((m) => m.content.toLowerCase()).join(" ");
	if (recent.match(/😄|😂|lol|haha|:\)|:D/)) return "playful" as Tone;
	if (recent.match(/sorry|i'm sorry|i am sorry|sad|hurt|missing you|miss you/)) return "sweet" as Tone;
	if (recent.match(/what do you want|clarity|are we|are we doing|are you free|now\?|right now/)) return "direct" as Tone;
	return "confident" as Tone;
}

function generateConversationalCoach(body: AdviceRequest, session?: SessionData) {
	const inferredTone = normalizeTone(body.tone) as Tone;
	const userMessage = (body.userMessage || "").trim();

	const short = (text: string) => text.slice(0, 350); // force shorter replies

	const recentTone = inferToneFromHistory(session?.conversationHistory);
	const effectiveTone = (recentTone || inferredTone || "confident") as Tone;
	const vibe = pickVibe(body.tone || body.goal || body.situation || body.userMessage);
	const intent = inferIntent(userMessage.toLowerCase());

	const script = scriptsByIntent(intent, effectiveTone, vibe);

	// ensure returned object shape
	return { message: short(script.message) };
}

// POST-only advice endpoint (conversational local coach)
app.post("/api/advice", (req, res) => {
	const body = (req.body || {}) as AdviceRequest;

	if (!body.userMessage || typeof body.userMessage !== "string") {
		return res.status(400).json({ error: "Missing userMessage (string)" });
	}

	const session = (req as any).sessionData as SessionData | undefined;

	// store the incoming user message in session conversationHistory (keep last 10)
	try {
		if (session) {
			session.conversationHistory.push({ role: "user", content: body.userMessage });
			if (session.conversationHistory.length > 10) {
				session.conversationHistory = session.conversationHistory.slice(-10);
			}
		}
	} catch (err) {
		// ignore session write errors — best-effort memory
		console.warn("session write error", err);
	}

	const data = generateConversationalCoach(body, session);

	// store assistant reply into session as well
	try {
		if (session && typeof data?.message === "string") {
			session.conversationHistory.push({ role: "assistant", content: data.message });
			if (session.conversationHistory.length > 10) {
				session.conversationHistory = session.conversationHistory.slice(-10);
			}
		}
	} catch (err) {
		console.warn("session write error", err);
	}

	return res.json(data);
});

app.get("/api/health", (req, res) => {
	res.json({ ok: true });
});

// Helper GET to make testing from browsers easier — POST is primary
app.get("/api/advice", (_req, res) => {
	res.status(200).json({
		ok: true,
		note: "This endpoint is POST-only. Send a POST request to /api/advice with JSON body.",
	});
});

/* ===============================
	 START SERVER
================================ */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`Dating Advice API running on port ${PORT}`);
});
