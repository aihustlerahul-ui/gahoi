# Gahoi Sarthi — Pending Setup & Third-Party Integration TODO List

This file tracks all pending third-party integrations, credential setups, and configuration tasks required for transitioning the Gahoi Sarthi application from development to staging/production.

---

## ☁️ 1. Cloudflare R2 Settings

- [ ] **Configure R2 CORS Policy**
  - **Why**: Needed to allow direct client-side image uploads (from the admin panel and mobile/web profiles) to your R2 bucket.
  - **Action**: Go to **Cloudflare Dashboard ➔ R2 ➔ Buckets ➔ `gahoi-sarthi` ➔ Settings ➔ CORS Policy** and add:
    ```json
    [
      {
        "AllowedOrigins": [
          "http://localhost:3000",
          "http://localhost:3002",
          "https://your-web-app.com",
          "https://your-admin-panel.com"
        ],
        "AllowedMethods": ["PUT", "GET"],
        "AllowedHeaders": ["Content-Type"],
        "MaxAgeSeconds": 3600
      }
    ]
    ```

- [ ] **Set `R2_PUBLIC_URL` in `.env`**
  - **Why**: Public access is required to render push notifications banner images and public user profiles.
  - **Action**: Enable public bucket access or attach a custom domain to your `gahoi-sarthi` R2 bucket in Cloudflare, then copy the domain URL and set it in your backend `.env` file:
    ```env
    R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
    ```

---

## 💳 2. Razorpay Payments

- [ ] **Configure Razorpay Webhook**
  - **Why**: Webhooks are critical to listen to transaction success events (`payment.captured`, `order.paid`) and automatically activate user subscription tiers on the backend.
  - **Action**: Set up a webhook pointing to `https://<your-backend-domain>/v1/payments/webhook` on your Razorpay Dashboard.
  - **Event Subscriptions**: Subscribe to `payment.captured` and `subscription.activated` (if recurring).

- [ ] **Set `RAZORPAY_WEBHOOK_SECRET` in `.env`**
  - **Why**: Protects the webhook route from fake success payloads.
  - **Action**: Generate a secure webhook secret key on the dashboard and save it to:
    ```env
    RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
    ```

- [ ] **Upgrade to Razorpay Live Keys**
  - **Why**: The current configuration uses test keys (`rzp_test_Se4PgvOZlFzVgH`).
  - **Action**: Swap these out for production keys on both backend and frontend environments.
    ```env
    RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
    RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxx
    ```

---

## 🔑 3. Google OAuth & Auth Setup

- [ ] **Set up Google Cloud Console Project**
  - **Why**: Google Login is needed for authentication on the web and mobile apps.
  - **Action**: Create a project in Google Cloud, configure the OAuth Consent Screen, and obtain credentials for Web/iOS/Android clients.

- [ ] **Fill Google Client IDs in Frontend Env Files**
  - **Action**: Update the client ID in:
    - Web: `apps/web/.env.local` ➔ `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
    - Mobile: `apps/mobile/.env` ➔ `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

---

## 🔒 4. Production JWT Key Hardening

- [ ] **Generate Production RS256 Keys**
  - **Why**: The test/dev environment uses a pre-configured key set. For production, you must generate a unique private/public key pair.
  - **Action**: Run the following commands:
    ```bash
    # Generate private key
    openssl genrsa -out private.pem 2048
    # Extract public key
    openssl rsa -in private.pem -pubout -out public.pem
    # Base64-encode keys for environment variable storage
    base64 private.pem
    base64 public.pem
    ```
  - **Action**: Save the base64-encoded strings to `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` in the production environment.

---

## 📱 5. Expo Push Notifications

- [ ] **Expo EAS Credentials & Setup**
  - **Why**: Mobile push notifications rely on Expo's Push service.
  - **Action**: Register the app with your Expo developer account using `eas build:configure` to link it and fetch Push credentials for production notifications.
