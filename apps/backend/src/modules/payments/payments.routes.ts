import { Router, Request, Response } from 'express';
import { authGuard, type AuthRequest } from '../../middleware/auth-guard';
import { CreateOrderSchema, VerifyPaymentSchema } from './payments.schema';
import { createOrder, verifyPayment, handleWebhook, listPlans } from './payments.service';

export const paymentsRouter = Router();

// GET /v1/payments/plans — public
paymentsRouter.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await listPlans();
    res.json({ success: true, data: plans, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch plans', meta: {} });
  }
});

// POST /v1/payments/create-order — authenticated
paymentsRouter.post('/create-order', authGuard, async (req: AuthRequest, res: Response) => {
  const result = CreateOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const order = await createOrder(req.userId!, result.data);
    res.status(201).json({ success: true, data: order, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create order';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// POST /v1/payments/verify — authenticated
paymentsRouter.post('/verify', authGuard, async (req: AuthRequest, res: Response) => {
  const result = VerifyPaymentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const data = await verifyPayment(req.userId!, result.data);
    res.json({ success: true, data, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment verification failed';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// POST /v1/payments/webhook — Razorpay webhook (raw body needed)
paymentsRouter.post(
  '/webhook',
  (req: Request, _res: Response, next) => {
    // Express raw body parsing for webhook signature verification
    next();
  },
  async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      res.status(400).json({ success: false, data: null, error: 'Missing signature', meta: {} });
      return;
    }
    try {
      await handleWebhook(req.body as Buffer, signature);
      res.json({ success: true, data: { received: true }, error: null, meta: {} });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Webhook error';
      res.status(400).json({ success: false, data: null, error: msg, meta: {} });
    }
  }
);
