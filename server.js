import express from 'express';
import cors from 'cors';

const app = express();

// IMPORTANT: CORS must be configured BEFORE any routes or auth middleware
const ALLOWED_ORIGINS = [
  "https://sparkdd.live",
  "https://www.sparkdd.live",
  "http://localhost:3000",
  // example preview domain seen in your screenshot — keep this entry for previews
  "https://datingapp-frontend-frontend-azkdqby1e-quises-projects-89577714.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (curl, postman)
      if (!origin) return cb(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);

      // allow any vercel preview domain for this project (helps with ephemeral preview URLs)
      const isAllowedVercelPreview =
        origin?.endsWith('.vercel.app') && origin.includes('datingapp-frontend-frontend');

      if (isAllowedVercelPreview) return cb(null, true);

      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// handle preflight for ALL routes
app.options("*", cors());

// parse JSON bodies
app.use(express.json());

// Health endpoints for Railway
app.get('/', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Dating Advice API running on port ${PORT}`);
});
