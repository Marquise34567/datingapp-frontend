import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { z } from "zod";

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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/advice", async (req, res) => {
	try {
		const { situation, goal, tone, conversation, userMessage } = req.body ?? {};

		if (!userMessage || typeof userMessage !== "string") {
			return res.status(400).json({ error: "Missing userMessage (string)" });
		}

		// Keep prompt tight & repeatable
		const input = [
			{
				role: "system",
				content:
					"You are DateCoach: a premium dating coach. Give practical, respectful, non-manipulative advice. " +
					"Prioritize clarity, confidence, and consent. Keep texts short (1–2 sentences).",
			},
			{
				role: "user",
				content: JSON.stringify({
					situation: situation ?? "General",
					goal: goal ?? "Get the best next message",
					tone: tone ?? "confident",
					conversation: Array.isArray(conversation) ? conversation : [],
					userMessage,
				}),
			},
		];

		const response = await openai.responses.create({
			model: "gpt-4o-mini",
			input,
			// Structured Outputs (JSON schema)
			text: {
				format: {
					type: "json_schema",
					name: "dating_advice",
					schema: {
						type: "object",
						additionalProperties: false,
						properties: {
							strategy: {
								type: "object",
								additionalProperties: false,
								properties: {
									headline: { type: "string" },
									why: { type: "string" },
									do: { type: "array", items: { type: "string" } },
									dont: { type: "array", items: { type: "string" } },
								},
								required: ["headline", "why", "do", "dont"],
							},
							replies: {
								type: "object",
								additionalProperties: false,
								properties: {
									confident: { type: "array", items: { type: "string" } },
									playful: { type: "array", items: { type: "string" } },
									sweet: { type: "array", items: { type: "string" } },
									direct: { type: "array", items: { type: "string" } },
								},
								required: ["confident", "playful", "sweet", "direct"],
							},
							datePlan: {
								type: "object",
								additionalProperties: false,
								properties: {
									idea: { type: "string" },
									textToSend: { type: "string" },
									logistics: { type: "array", items: { type: "string" } },
								},
								required: ["idea", "textToSend", "logistics"],
							},
						},
						required: ["strategy", "replies", "datePlan"],
					},
				},
			},
		});

		// The SDK returns structured JSON in the text output
		const jsonText = response.output_text; // string of JSON
		const data = JSON.parse(jsonText);

		return res.json(data);
	} catch (err: any) {
		console.error(err);
		return res.status(500).json({ error: err?.message || "OpenAI request failed" });
	}
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
