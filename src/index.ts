import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();

const allowedOrigins = [
	"http://localhost:5173",
	"http://localhost:5174",
	"http://localhost:5175",
	"https://YOUR-FRONTEND-DOMAIN.com",
];

app.use(
	cors({
		origin: (origin, callback) => {
			// allow requests with no origin (e.g., mobile apps, curl)
			if (!origin) return callback(null, true);
			if (allowedOrigins.includes(origin)) return callback(null, true);
			return callback(new Error("CORS policy: Origin not allowed"));
		},
		credentials: true,
	})
);
app.use(express.json({ limit: "1mb" }));

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

app.post("/api/advice", async (req, res) => {
	const parsed = AdviceRequestSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ error: parsed.error.flatten() });
	}

	const safety = safetyCheck(parsed.data);

	if (safety.blocked) {
		return res.status(400).json({ error: safety.message });
	}

	try {
		const result = await generateAdvice(parsed.data);
		return res.json(result);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Advice generation failed" });
	}
});

app.get("/api/health", (req, res) => {
	res.json({ ok: true });
});

/* ===============================
	 START SERVER
================================ */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`Dating Advice API running on port ${PORT}`);
});
