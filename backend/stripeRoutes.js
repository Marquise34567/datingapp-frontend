import express from 'express';
import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';

const router = express.Router();

// Load environment
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');

if (!STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set. Stripe calls will fail.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

// Simple file-backed token store (replace with real DB in production)
const STORE_DIR = path.resolve(process.cwd(), 'backend');
const TOKENS_FILE = path.join(STORE_DIR, 'stripe_token_store.json');
const EVENTS_FILE = path.join(STORE_DIR, 'processed_events.json');

function readJsonSafe(file) {
  try {
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.warn('readJsonSafe error', e && e.message);
    return {};
  }
}

function writeJsonAtomic(file, obj) {
  try {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), { encoding: 'utf8' });
    fs.renameSync(tmp, file);
  } catch (e) {
    console.warn('writeJsonAtomic error', e && e.message);
  }
}

// init stores
let tokenStore = readJsonSafe(TOKENS_FILE);
let processedEvents = new Set(Object.keys(readJsonSafe(EVENTS_FILE) || {}));

function persistStores() {
  writeJsonAtomic(TOKENS_FILE, tokenStore);
  // processed events persisted as map for easy restore
  const pe = {};
  for (const id of processedEvents) pe[id] = true;
  writeJsonAtomic(EVENTS_FILE, pe);
}

// Helpers to mark token paid/unpaid
function markTokenPaid(token, { customerId, subscriptionId, expiresAt }) {
  tokenStore[token] = tokenStore[token] || {};
  tokenStore[token].paid = true;
  tokenStore[token].stripeCustomerId = customerId || tokenStore[token].stripeCustomerId || null;
  tokenStore[token].stripeSubscriptionId = subscriptionId || tokenStore[token].stripeSubscriptionId || null;
  tokenStore[token].expiresAt = expiresAt || tokenStore[token].expiresAt || null;
  tokenStore[token].updatedAt = new Date().toISOString();
  persistStores();
}

function markTokenUnpaid(token) {
  tokenStore[token] = tokenStore[token] || {};
  tokenStore[token].paid = false;
  tokenStore[token].updatedAt = new Date().toISOString();
  persistStores();
}

// Route: create checkout session
// Parse JSON for this route specifically (webhook uses raw body)
router.post('/create-checkout-session', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const body = req.body || {};
    const token = body.token;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ ok: false, error: 'token_required' });
    }

    if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !APP_URL) {
      return res.status(500).json({ ok: false, error: 'stripe_not_configured' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      metadata: { token },
      success_url: `${APP_URL}/success`,
      cancel_url: `${APP_URL}/cancel`,
    });

    if (!session || !session.url) {
      return res.status(500).json({ ok: false, error: 'no_session_url' });
    }

    return res.json({ ok: true, url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err && err.message);
    return res.status(500).json({ ok: false, error: 'checkout_creation_failed' });
  }
});

export default router;
