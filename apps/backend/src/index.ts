import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

// Route modules
import { authRouter } from './modules/auth/auth.routes';
import { profileRouter } from './modules/profile/profile.routes';
import { galleryRouter } from './modules/profile/gallery.routes';
import { pushTokenRouter } from './modules/profile/push-token.routes';
import { interestsRouter } from './modules/interests/interests.routes';
import { matchesRouter } from './modules/matches/matches.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { adminAuthRouter } from './modules/admin/admin-auth.routes';
import { shortlistRouter } from './modules/interests/shortlist.routes';

const app: Application = express();
const PORT = process.env.PORT ?? 3001;

// ── Raw body for Razorpay webhook (must come before express.json) ─────────────
app.use('/v1/payments/webhook', express.raw({ type: 'application/json' }));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── CORS ───────────────────────────────────────────────────────────────────────
const corsOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:3000',
  process.env.ADMIN_URL ?? 'http://localhost:3002',
];

if (process.env.NODE_ENV !== 'production') {
  // Expo web dev (Metro serves on varying ports)
  corsOrigins.push(
    'http://localhost:8081',
    'http://localhost:8090',
    'http://localhost:19006',
  );
}

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  })
);

// ── Global rate limiters ───────────────────────────────────────────────────────

// Unauthenticated: 100 req/min per IP
const globalUnauthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many requests', meta: {} },
});

// Authenticated: 300 req/min per user (applied per-router via userId key)
const globalAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req: Request) => {
    const auth = req.headers.authorization;
    if (auth) return auth; // Use token as key for authenticated routes
    return req.ip ?? 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many requests', meta: {} },
  skip: (req: Request) => !req.headers.authorization,
});

app.use(globalUnauthLimiter);
app.use(globalAuthLimiter);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', version: '1.0.0' }, error: null, meta: {} });
});

// ── API v1 routes ──────────────────────────────────────────────────────────────
app.use('/v1/auth', authRouter);
app.use('/v1/profile', profileRouter);
app.use('/v1/profile/me/gallery', galleryRouter);
app.use('/v1/profile/me/push-token', pushTokenRouter);
app.use('/v1/interests', interestsRouter);
app.use('/v1/matches', matchesRouter);
app.use('/v1/payments', paymentsRouter);
app.use('/v1/admin', adminRouter);
app.use('/v1/admin-auth', adminAuthRouter);
app.use('/v1/shortlist', shortlistRouter);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, data: null, error: 'Route not found', meta: {} });
});

// ── Start ───────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.warn(`🚀 Gahoi Sarthi API running on port ${PORT}`);
  });
}

export default app;
