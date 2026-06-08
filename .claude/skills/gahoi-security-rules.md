# Gahoi Sarthi — Security Rules

Use this skill when writing any auth, middleware, payment, or data-access code.

## JWT

- Algorithm must be RS256 explicitly — algorithms: ['RS256'] in jwt.verify()
- Never use 'none' algorithm
- Access token: 15 min expiry
- Refresh token: 30 day expiry, stored in HttpOnly cookie (web) or Expo SecureStore (mobile)
- On refresh token reuse detection: invalidate ALL sessions for that user immediately

## OTP

- Always use crypto.timingSafeEqual() for OTP comparison — never ===
- Always return the same error message regardless of failure reason: 'Invalid or expired OTP'
- Max 5 attempts, then lockout — escalating: 30min → 2hr → 4hr → 24hr

## Rate limiting — apply to every route

- Unauthenticated: 100 req/min per IP
- Authenticated: 300 req/min per user
- Search endpoints: 10/hr free, 60/hr paid
- Profile view: 30/hr free, 120/hr paid
- OTP send: 5 per email per hour

## Payments

- Always verify Razorpay HMAC-SHA256 signature before processing any webhook
- Always check timestamp freshness (reject webhooks older than 5 minutes)
- Always check idempotency (payment ID already in DB? Ignore silently)
- Subscription creation + user tier update must be a single Prisma transaction

## File uploads

- Validate MIME type AND magic bytes using file-type library — not just extension
- Max 5MB enforced in presigned URL generation via R2 content-length condition
- Accepted types: image/jpeg, image/png, image/webp only

## R2 images

- R2 bucket is PRIVATE — never enable public bucket access
- All images served via signed URLs with 2-hour expiry
- Object keys: profiles/{userId}/{uuidv4()}.jpg — never predictable paths
