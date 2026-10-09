# Supabase project migration checklist

Target project: `cohywcxpfusfsdqvlchr`

## Important status

The application config has been pointed at the target project, but this repository integration cannot authenticate to the Supabase management API. Therefore, the target database schema, Auth users, Storage buckets, Edge Functions, secrets, and existing data have **not** been provisioned or verified by this change.

Do not deploy the app to production until the items below are complete.

## 1. Configure local environment

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_PUBLISHABLE_KEY` (or the project's legacy anon key) using the public client key shown in the target Supabase project's API settings. Never use a `service_role` or secret key in a Vite variable.

Set the same variables in your hosting provider's production environment.

## 2. Create/migrate schema

Review and apply the SQL files under `supabase/migrations/` to the target database in chronological order, after reviewing for duplicate timestamp prefixes and checking the target's current schema. This repo has historical migration files with overlapping/duplicate schema operations; blindly running every migration against a non-empty database may fail or cause inconsistent security policies.

The schema needs to support the current Artisan Invoices code, including customers, invoices, quotations, payments, settings, profiles, user_roles, fabrics/order sheets/assignments and any other tables still used by the UI. Inspect the latest migrations before applying. Validate foreign keys, indexes, triggers, enum types, views, and RLS.

**Security review required:** some historical migrations contain permissive policies such as `USING (true)`. Do not carry those policies to production without confirming intent. Keep RLS enabled and restrict each tenant-owned table to authenticated users' rows. Admin functions must perform server-side role checks.

## 3. Migrate Auth and data

If the old Supabase project contains production data, export and import the required rows and Auth users with a deliberate migration plan. Preserve user UUIDs wherever table foreign keys reference `auth.users`. Verify row counts and foreign-key integrity. Do not copy production data over a target database without a backup.

If users must reset passwords after Auth migration, communicate this before cutover.

## 4. Edge Functions

Deploy every function under `supabase/functions/` to the target project. Configure all required function secrets in the Supabase dashboard/CLI; never commit secret values. Check that the functions use the intended JWT verification setting and apply authorization checks internally where JWT verification is disabled.

## 5. Auth, Storage, Realtime, and redirect settings

- Enable the required email/password provider.
- Set Site URL and allowed redirect URLs for local development and the production domain.
- Recreate required Storage buckets and their access policies for company logos and uploaded assets.
- Enable Realtime for tables subscribed to by the app.
- Review SMTP/email configuration and Edge Function email provider settings.

## 6. Validate before cutover

- Register, sign in, sign out, refresh, and password reset.
- Verify tenant isolation using two different users.
- Test customer CRUD, quotation CRUD, invoice CRUD, payment creation and settings.
- Test all admin user-management functions.
- Test logo/file upload and download.
- Run `npm run build` and `npm run lint`.
- Confirm PWA caching does not expose stale authenticated data.
- Confirm the target project's database backups and restore strategy.

## 7. Cutover

After the schema/data/functions/settings checks pass, deploy the frontend with the target project URL and publishable key. Keep the old project available until the new deployment has passed acceptance testing.
