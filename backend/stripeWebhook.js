import express from 'express';
import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';

const router = express.Router();

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn('Warning: STRIPE_WEBHOOK_SECRET not set; webhook signature verification will fail.');
}
if (!STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY not set; some webhook processing may be limited.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

// File-backed persistence for demo; replace with DB in production
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

let tokenStore = readJsonSafe(TOKENS_FILE);
let processedEvents = new Set(Object.keys(readJsonSafe(EVENTS_FILE) || {}));

function persistStores() {
  writeJsonAtomic(TOKENS_FILE, tokenStore);
  const pe = {};
  for (const id of processedEvents) pe[id] = true;
  writeJsonAtomic(EVENTS_FILE, pe);
}

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

// Webhook route: raw body parser ONLY for this route
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('/api/webhook/stripe called but STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).send('webhook_not_configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.warn('stripe webhook signature verification failed:', err && err.message);
    return res.status(400).send('invalid_signature');
  }

  // Prevent duplicate processing
  if (processedEvents.has(event.id)) {
    console.log('webhook duplicate event ignored:', event.id);
    return res.status(200).send('duplicate_event');
  }

  // Process events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const token = session.metadata && session.metadata.token;
        const customerId = session.customer || null;
        const subscriptionId = session.subscription || null;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        if (token) {
          markTokenPaid(token, { customerId, subscriptionId, expiresAt });
          console.log('checkout.session.completed: token marked paid', { token, customerId });
        } else {
          console.warn('checkout.session.completed missing metadata.token for session', session.id || '(unknown)');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        let found = 0;
        for (const [token, rec] of Object.entries(tokenStore)) {
          if (rec.stripeCustomerId && rec.stripeCustomerId === String(customerId)) {
            markTokenUnpaid(token);
            found++;
          }
        }
        console.log('invoice.payment_failed processed for customer', customerId, 'tokensUpdated', found);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        let found = 0;
        for (const [token, rec] of Object.entries(tokenStore)) {
          if (rec.stripeCustomerId && rec.stripeCustomerId === String(customerId)) {
            markTokenUnpaid(token);
            found++;
          }
        }
        console.log('customer.subscription.deleted processed for customer', customerId, 'tokensUpdated', found);
        break;
      }

      default:
        console.log('ignored stripe event type:', event.type);
        break;
    }

    // mark event processed and persist
    processedEvents.add(event.id);
    persistStores();

    // Respond 200 immediately after successful handling
    return res.status(200).send('received');
  } catch (err) {
    console.error('webhook processing error:', err && err.message);
    return res.status(500).send('webhook_processing_failed');
  }
});

export default router;
