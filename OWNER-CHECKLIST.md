# Your go-live checklist (owner side)

Code-side upgrade work is done. Complete these yourself:

## Clear demo catalog + enable editable marketing

In Supabase SQL Editor, also run:

- `supabase/migrations/20261002000000_clear_demo_catalog.sql` (if demo products exist)
- `supabase/migrations/20261002000001_editable_marketing_content.sql`

Edit copy anytime in **Admin → Settings** (announcement, homepage, about, value props, routine).

## 1. Supabase (your project — not Lovable Cloud)

1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL from `supabase/migrations/` in order (or `supabase/all_in_one.sql` on a fresh DB).
3. Copy project URL + anon/publishable key + **service role** key into `.env` and Vercel.
4. Auth → URL configuration: add `http://localhost:3000` and your Vercel domain to redirect allow-list.
5. Promote yourself to admin with `scripts/promote-admin.sql`.

## 2. Env vars

Copy `.env.example` → fill:

- `SUPABASE_*` + matching `VITE_SUPABASE_*`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_TO_EMAIL`
- `SITE_URL`, `CRON_SECRET`

## 3. Paystack

- Test key first, then live.
- Webhook URL: `https://YOUR_DOMAIN/api/public/paystack-webhook`

## 4. Resend

- Verify your sending domain (leave `onboarding@resend.dev` only for local tests).

## 5. Vercel

- Import your GitHub repo.
- Add the same env vars.
- Deploy; set `SITE_URL` to the production URL.

## 6. Git

Push from your machine (this folder may not have `.git` yet):

```bash
git init
git add .
git commit -m "Personal Relvan Lumina storefront (Supabase, Paystack, Resend, Vercel)"
git remote add origin git@github.com:YOUR_USER/relvan-glow-kit.git
git push -u origin main
```

Do **not** commit `.env`.
