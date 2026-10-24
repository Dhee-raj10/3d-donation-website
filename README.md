# Orbit — 3D Donation Website

A responsive, dark-themed donation landing page built with React + Vite, Three.js via React Three Fiber, and Razorpay Standard Checkout. It intentionally avoids a full e-commerce backend; the Express service only creates payment orders and verifies checkout signatures.

## Requirements

- Node.js 18+ (Node 20 LTS recommended)
- Razorpay account with **test-mode** API keys

## Run locally

```bash
npm install
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set your Razorpay **test** Key ID and Key Secret from the Razorpay Dashboard. Keep the secret only in `.env`; never put it in a `VITE_` variable or commit it to Git.

Open two terminals from the project directory:

Terminal 1 — payment service:

```bash
npm run server
```

Terminal 2 — frontend:

```bash
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`).

## Test-mode checklist

1. Confirm `/api/health` reports `paymentConfigured: true`.
2. Use Razorpay test keys, not live keys.
3. Use the test payment methods and test card details listed in Razorpay's official documentation/dashboard.
4. Test successful, cancelled, and failed checkout flows.
5. Confirm invalid amounts and missing email are rejected.

Test keys do not collect real money. Do not use live keys until your donation organization, disclosures, policies, and payment flow are ready.

## Architecture

- `src/App.jsx`: responsive landing page, donation form, Razorpay Checkout launch and result states.
- `src/DonationScene.jsx`: responsive 3D scene (Earth-inspired orb, orbit rings, stars).
- `server/index.js`: minimal Express API for order creation and signature verification.
- `vite.config.js`: local `/api` proxy.

## Production hardening before accepting real donations

This is a starter implementation, not a complete donation-accounting system. Before production:
- Deploy the API on HTTPS and restrict CORS to the real frontend origin.
- Add rate limiting, bot protection, structured logs, and request monitoring.
- Persist order/payment records and make verification idempotent.
- Verify captured payment status with Razorpay's API and process signed webhooks for reliable reconciliation; do not rely only on the browser callback.
- Add privacy notice, terms, refund/cancellation policy, donation-purpose disclosures, and any legally required receipts/tax wording.
- Use live credentials only in your hosting provider's server-side environment settings.
- For production deployment, update Vite's `/api` proxy strategy and point frontend API calls at your deployed API base URL if hosted separately.

## Official references

- Razorpay Standard Checkout: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
- Razorpay Node.js integration: https://razorpay.com/docs/payments/server-integration/nodejs/
- React Three Fiber: https://r3f.docs.pmnd.rs/
