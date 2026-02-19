import express from 'express';
import cors from 'cors';
import os from 'os';
import { adviceRouter } from './routes/advice';
import { getEntitlements, setPremium, getDailyRemaining } from './entitlements';

const app = express();

app.use(cors());
// Important: Stripe webhook needs the raw body. Register the raw parser
// route before the JSON body parser middleware so the raw payload is available.
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = (req.headers['stripe-signature'] || '') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(400).json({ ok: false, error: 'webhook not configured' });
  try {
    const Stripe = require('stripe');
    const stripeSecretEnv = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
    const stripe = new Stripe(String(stripeSecretEnv), { apiVersion: '2022-11-15' });
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const uid = session.client_reference_id || (session.metadata && session.metadata.sessionId) || session.metadata?.uid;
      const customer = session.customer;
      if (uid) {
        try {
          setPremium(uid, true, 'premium');
        } catch (e) {
          console.warn('failed to set premium from webhook', e);
        }
      }
      if (customer && uid) {
        try {
          const subs = session.subscription as any;
          const periodEndISO = subs && subs.current_period_end ? new Date(subs.current_period_end * 1000).toISOString() : null;
          const subscriptionId = subs && subs.id ? subs.id : (session.subscription as string) || null;
          try {
            const { updateStripeInfo } = require('./entitlements');
            updateStripeInfo(uid, { customerId: String(customer), subscriptionId: subscriptionId, currentPeriodEnd: periodEndISO });
          } catch (e) {
            console.warn('failed to update stripe info', e);
          }
        } catch (e) {
          console.warn('failed to process session subscription info', e);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
      const obj = event.data.object as any;
      const customerId = obj.customer;
      try {
        const { entitlementsStore, updateStripeInfo, setPremium } = require('./entitlements');
        for (const [uid, val] of entitlementsStore) {
          if (val.stripeCustomerId === customerId) {
            updateStripeInfo(uid, { currentPeriodEnd: null });
            setPremium(uid, false, null);
          }
        }
      } catch (e) {
        console.warn('failed to handle subscription deletion', e);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.warn('webhook handling error', err && err.message);
    return res.status(400).json({ ok: false, error: 'invalid webhook event' });
  }
});
// Ensure body parsing is configured before routes and with sane limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/advice', adviceRouter);

app.get('/api/me/entitlements', (req, res) => {
  const sessionId = (req.query.sessionId as string) || req.headers['x-session-id'] as string;
  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });
  try {
    const ent = getEntitlements(sessionId);
    const daily = getDailyRemaining(sessionId);
    return res.json({ ok: true, plan: ent?.plan ?? 'free', isPremium: !!ent?.isPremium, dailyLimit: daily.dailyLimit, dailyUsed: daily.dailyUsed, dailyRemaining: daily.dailyRemaining, advanced: !!ent?.isPremium, stripeCustomerId: ent?.stripeCustomerId ?? null, stripeSubscriptionId: ent?.stripeSubscriptionId ?? null, currentPeriodEnd: ent?.currentPeriodEnd ?? null });
  } catch (err) {
    console.warn('entitlements fetch error', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch entitlements' });
  }
});

// Public entitlements endpoint (alias) for clients
app.get('/api/entitlements', (req, res) => {
  const sessionId = (req.query.sessionId as string) || req.headers['x-session-id'] as string;
  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });
  try {
    const ent = getEntitlements(sessionId);
    const daily = getDailyRemaining(sessionId);
    return res.json({ ok: true, plan: ent?.plan ?? 'free', isPremium: !!ent?.isPremium, dailyLimit: daily.dailyLimit, dailyUsed: daily.dailyUsed, dailyRemaining: daily.dailyRemaining, advanced: !!ent?.isPremium, stripeCustomerId: ent?.stripeCustomerId ?? null, stripeSubscriptionId: ent?.stripeSubscriptionId ?? null, currentPeriodEnd: ent?.currentPeriodEnd ?? null });
  } catch (err) {
    console.warn('entitlements fetch error', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch entitlements' });
  }
});

app.post('/api/admin/set-premium', (req, res) => {
  const { uid, isPremium } = req.body || {};
  if (!uid) return res.status(400).json({ ok: false, error: 'uid required' });
  try {
    setPremium(uid, !!isPremium);
    return res.json({ ok: true, uid, isPremium: !!isPremium });
  } catch (err) {
    console.warn('set-premium failed', err);
    return res.status(500).json({ ok: false, error: 'Failed to set premium' });
  }
});

// Dev stub: create a checkout session and return a checkout URL.
app.post('/api/checkout', async (req, res) => {
  // Create a Stripe Checkout Session for a subscription and return the hosted URL
  const body = req.body || {};
  const sessionId = body.sessionId || body.uid || req.headers['x-session-id'];
  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const rawPrice = process.env.STRIPE_PRICE_ID || '';
  const priceId = rawPrice.trim().replace(/[^\w-]/g, '');
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;

  if (!stripeSecret || !priceId) {
    console.warn('stripe config missing: STRIPE_SECRET_KEY or STRIPE_PRICE_ID');
    return res.status(500).json({ ok: false, error: 'stripe configuration missing' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(String(stripeSecret), { apiVersion: '2022-11-15' });

    const email = (body && (body.email as string)) || (req.headers['x-user-email'] as string) || undefined;

    const successUrl = `${appUrl.replace(/\/$/, '')}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl.replace(/\/$/, '')}/billing/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: String(priceId), quantity: 1 }],
      client_reference_id: String(sessionId),
      customer_email: email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session || !session.url) {
      console.warn('Stripe session created but no url returned', session);
      return res.status(500).json({ ok: false, error: 'No checkout url returned' });
    }

    return res.json({ ok: true, url: session.url });
  } catch (err: any) {
    console.warn('checkout create failed', err);
    return res.status(500).json({ ok: false, error: err?.message ?? 'Failed to create checkout', details: err?.code ?? null });
  }
});

// New route: create a Stripe Checkout Session and return session.url
app.post('/api/billing/create-checkout-session', async (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = body.sessionId || body.uid || req.headers['x-session-id'];
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const rawPrice = process.env.STRIPE_PRICE_ID || '';
    const priceId = rawPrice.trim().replace(/[^\w-]/g, '');
    const appUrl = (process.env.APP_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`).replace(/\/$/, '');

    if (!stripeSecret || !priceId) {
      console.warn('Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID');
      return res.status(500).json({ ok: false, error: 'stripe configuration missing' });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(String(stripeSecret), { apiVersion: '2022-11-15' });

    const email = (body && (body.email as string)) || (req.headers['x-user-email'] as string) || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: String(priceId), quantity: 1 }],
      client_reference_id: String(sessionId),
      customer_email: email || undefined,
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
    });

    if (!session || !session.url) {
      console.warn('Stripe session created but no url returned', session);
      return res.status(500).json({ ok: false, error: 'No checkout url returned' });
    }

    return res.json({ url: session.url });
  } catch (err: any) {
    console.warn('create-checkout-session failed', err);
    return res.status(500).json({ ok: false, error: err?.message ?? 'Failed to create checkout session', stripeError: err?.type ?? null });
  }
});

// Compatibility route: some clients call /api/stripe/create-checkout-session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = body.sessionId || body.uid || req.headers['x-session-id'];
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const rawPrice = process.env.STRIPE_PRICE_ID || '';
    const priceId = rawPrice.trim().replace(/[^\w-]/g, '');
    const appUrl = (process.env.APP_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`).replace(/\/$/, '');

    if (!stripeSecret || !priceId) {
      console.warn('Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID (compat route)');
      return res.status(500).json({ ok: false, error: 'stripe configuration missing' });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(String(stripeSecret), { apiVersion: '2022-11-15' });

    const email = (body && (body.email as string)) || (req.headers['x-user-email'] as string) || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: String(priceId), quantity: 1 }],
      client_reference_id: String(sessionId),
      customer_email: email || undefined,
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
    });

    if (!session || !session.url) {
      console.warn('Stripe session created but no url returned (compat route)', session);
      return res.status(500).json({ ok: false, error: 'No checkout url returned' });
    }

    return res.json({ url: session.url });
  } catch (err: any) {
    console.warn('create-checkout-session (compat) failed', err);
    return res.status(500).json({ ok: false, error: err?.message ?? 'Failed to create checkout session', stripeError: err?.type ?? null });
  }
});



// Legacy webhook path for compatibility
app.post('/api/webhook', (req, res) => res.status(404).json({ ok: false, error: 'use /api/webhook/stripe' }));

// Premium-only support route (dev): accessible only to premium users
app.post('/api/support', (req, res) => {
  const sessionId = (req.body && (req.body as any).sessionId) || req.headers['x-session-id'];
  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });
  try {
    const ent = getEntitlements(String(sessionId));
    if (!ent || !ent.isPremium) return res.status(403).json({ ok: false, error: 'premium_required' });
    return res.json({ ok: true, message: 'Priority support request received. We will respond shortly (dev stub).' });
  } catch (err) {
    console.warn('support error', err);
    return res.status(500).json({ ok: false, error: 'support_failed' });
  }
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  const interfaces = os.networkInterfaces();
  let networkAddress: string | null = null;
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        networkAddress = `http://${iface.address}:${port}`;
        break;
      }
    }
    if (networkAddress) break;
  }

  const localAddress = `http://localhost:${port}`;
  if (networkAddress) {
    console.log(`Dating Advice API listening on ${localAddress} (network: ${networkAddress})`);
  } else {
    console.log(`Dating Advice API listening on ${localAddress}`);
  }
});
