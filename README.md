# Artisan Invoices

Artisan Invoices is a React + TypeScript application for customer, quotation, invoice, payment, and business-settings management. Supabase provides authentication, PostgreSQL, realtime, and Edge Functions.

## Stack

- React 18, TypeScript, Vite
- Tailwind CSS and shadcn/ui
- Supabase Auth, PostgreSQL, Realtime, Storage and Edge Functions
- Vite PWA for installable web-app support

## Local development

Requirements: Node.js 18+ and npm.

```bash
git clone https://github.com/MarquisOgre/Artisan-Invoices.git
cd Artisan-Invoices
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The publishable/anon key is a browser key; never expose a Supabase service-role or secret key in frontend environment variables.

## Supabase project setup

The repository is configured for project `cohywcxpfusfsdqvlchr` at `https://cohywcxpfusfsdqvlchr.supabase.co`.

Before deploying:
1. Apply the reviewed SQL schema/migrations to the target Supabase project.
2. Configure Auth providers, Site URL and redirect URLs.
3. Deploy all required functions in `supabase/functions/` and configure their secrets.
4. Configure Storage buckets/policies and Realtime table publication as required.
5. Verify Row Level Security, user-role checks and tenant isolation.
6. If switching from an existing project, migrate production data and Auth users deliberately and validate row counts and foreign keys.

See [Supabase migration checklist](supabase/README-MIGRATION.md). Historical migration files overlap and some contain permissive policies; review the current target schema and policies before applying these SQL files to production. Changing the frontend URL alone does not migrate the database, users, uploaded files, or Edge Functions.

## Build, lint, preview

```bash
npm run build
npm run lint
npm run preview
```

## Deployment

Deploy the Vite static frontend with any static hosting provider (for example, Vercel, Netlify, or Cloudflare Pages). Configure the three Vite environment variables in the host's project settings. Use `npm run build` and publish `dist/`.

Do not commit `.env.local` or secrets. The repository ignores local environment files.

## Supabase Edge Functions

Function source is under `supabase/functions/`. Deploy using the Supabase CLI after logging in and linking the project:

```bash
supabase login
supabase link --project-ref cohywcxpfusfsdqvlchr
supabase functions deploy
```

Review each function's JWT and authorization requirements before deploying. In particular, functions configured with `verify_jwt = false` must enforce any needed authentication/authorization checks internally.

## Security

- Keep Row Level Security enabled on application tables.
- Restrict access to each user's own rows, and check admin roles server-side.
- Never put service-role keys, database passwords or other server secrets in browser code or Vite-prefixed environment variables.
- Set production Auth redirect URLs explicitly and test isolation using more than one account.
