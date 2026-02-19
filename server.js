import express from 'express';
import cors from 'cors';
import stripeRoutes from './backend/stripeRoutes.js';
import stripeWebhook from './backend/stripeWebhook.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.APP_URL || 'https://YOUR-FRONTEND-DOMAIN.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS policy: Origin not allowed'));
    },
    credentials: true,
  })
);

// Mount webhook route EXACTLY at /api/webhook/stripe BEFORE the global JSON parser
app.use('/api/webhook/stripe', stripeWebhook);

// Mount other stripe-related routes (checkout, etc.) BEFORE json as well is fine
app.use('/api/stripe', stripeRoutes);

// Global JSON parser for all other routes (webhook uses raw body above)
app.use(express.json({ limit: '1mb' }));

// Health endpoints for Railway
app.get('/', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// Generic error handler (production-safe)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, error: 'internal_server_error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Dating Advice API running on port ${PORT}`);
});
