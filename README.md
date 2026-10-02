# RELVAN LUMINA

Premium Korean skincare e-commerce storefront — TanStack Start, Supabase, Paystack, Resend, Vercel.

## Stack

| Layer | Choice |
|--------|--------|
| App | TanStack Start + React 19 + TanStack Router/Query |
| UI | Tailwind CSS 4 + shadcn/ui |
| Database / Auth | Supabase (Postgres + Auth + Storage + RLS) |
| Payments | Paystack |
| Email | Resend |
| Deploy | Vercel (Nitro) |

## Local setup

1. **Clone & install**

```bash
npm install
cp .env.example .env
```

(Or `bun install` if you use Bun.)

2. **Create your own Supabase project** at [supabase.com](https://supabase.com) (do not use Lovable Cloud).

3. Apply SQL migrations from `supabase/migrations/` in order (or run `supabase/all_in_one.sql` on a fresh project).

4. Fill `.env` with your Supabase URL/keys, Paystack secret, Resend API key, and a `CRON_SECRET`.

5. Start the app:

```bash
npm run dev
```

## Environment variables

See [`.env.example`](./.env.example) for the full list. Required for production:

- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- Matching `VITE_SUPABASE_*` public values
- `PAYSTACK_SECRET_KEY`
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `CONTACT_TO_EMAIL`
- `SITE_URL` (your Vercel domain, e.g. `https://relvanlumina.com`)
- `CRON_SECRET` (Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`)

## Deploy on Vercel

1. Import the GitHub repo in Vercel (`kielteemusic/relvan-glow-kit`).
2. Framework should detect as **TanStack Start** (see `vercel.json`).
3. Add the same env vars in Project Settings → Environment Variables.
4. Deploy.
5. In Paystack, set the webhook URL to:

   `https://YOUR_DOMAIN/api/public/paystack-webhook`

6. In Supabase Auth, add your Vercel URL(s) to redirect allow-list.

### Cron

`/api/cron/expire-orders` runs hourly on Pro (see `vercel.json`; Hobby plans are limited to once/day — change the schedule if needed) and releases expired pending stock reservations. Set `CRON_SECRET` in Vercel so requests are authenticated.

## Emails (Resend)

- **Order confirmation** — sent after Paystack payment is finalized (webhook or verify).
- **Contact form** — forwards to `CONTACT_TO_EMAIL` and acknowledges the customer.

Verify a domain in Resend for production senders (replace the `onboarding@resend.dev` default).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle generate (optional) |

## Project ownership

This project was originally scaffolded with Lovable and is now a standalone personal codebase. See **[OWNER-CHECKLIST.md](./OWNER-CHECKLIST.md)** for your Supabase / Paystack / Resend / Vercel / Git steps.
