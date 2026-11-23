# SalonBook Server

Express and TypeScript REST API for SalonBook, a role-based salon appointment platform.

## Features

- Better Auth email/password and optional Google OAuth
- Cookie-session and signed JWT bearer-token verification
- Admin/customer role authorization and blocked-user enforcement
- Active service catalogue with search, filtering, sorting, and image uploads
- Appointment conflict prevention and role-safe appointment management
- Stripe Checkout with verified webhook-only payment updates
- Protected dashboard statistics, customer management, and transaction history

## Stack

Node.js, Express 5, TypeScript, MongoDB/Mongoose, Better Auth, jose, Stripe, Zod, ImgBB.

## Local setup

```bash
npm install
copy .env.example .env # Windows
# cp .env.example .env # macOS/Linux
npm run dev
```

The API runs on `http://localhost:5000` by default. Run `npm run build && npm start` for a production-style check.

## Environment variables

Set these names in the server environment; never commit the values:

`NODE_ENV`, `PORT`, `CLIENT_URL`, `MONGODB_URI`, `MONGODB_DB_NAME`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `JWT_SECRET`, `ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`, `IMGBB_API_KEY`.

For production, set `CLIENT_URL` to the deployed client URL and `BETTER_AUTH_URL` to the deployed API URL. Add the Google callback URL `${BETTER_AUTH_URL}/api/auth/callback/google`, and create the Stripe webhook endpoint `${BETTER_AUTH_URL}/api/payments/webhook` for `checkout.session.completed`.

## Deployment

Deploy from the server repository (or configure the hosting root directory to `SalonBook-Server`), set the variables above, run `npm install`, and use `npm run build` as the build command and `npm start` as the start command. Confirm `/api/health` returns JSON before connecting the client.

## Repository

https://github.com/SabikunEthika/SalonBook-Server
