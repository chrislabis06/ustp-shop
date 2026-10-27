# Tatak Swap

A student marketplace for USTP built with Next.js, Supabase Auth, PostgreSQL, Storage, and Realtime.

## Local setup

1. Install dependencies with `npm install`.
2. Create a Supabase project and copy its project URL and anon/publishable key into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Back up the legacy tables, then apply [`supabase/migrations/20261027000000_upgrade_legacy_schema.sql`](supabase/migrations/20261027000000_upgrade_legacy_schema.sql) followed by [`supabase/migrations/20261028000000_optional_listing_size.sql`](supabase/migrations/20261028000000_optional_listing_size.sql) in the Supabase SQL Editor. The upgrade maps legacy integer users to Auth UUIDs by email and aborts if mappings are incomplete; review its preflight errors before retrying. It preserves integer listing/conversation IDs, creates profiles/favorites, migrates participant IDs and `message_text` to the current schema, and sets row-level security, storage, and Realtime policies. The second migration adds nullable `listings.size`.
4. Sign up and confirm `chrislabis06@gmail.com` through the normal app flow. The migration allowlists this address; after applying it, sign in with that account and open `/admin`. The dashboard is read-only and links to the normal student storefront for user-side preview; it does not impersonate users.
5. In Supabase Auth URL Configuration, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect URL allowlist. Add the production equivalents after deployment.
6. Configure an email provider in Supabase Auth before inviting real users. For production, configure SMTP and verify the sender domain; the signup and recovery flows use confirmation links handled by `/auth/callback`.
7. Start the app with `npm run dev` and open `http://localhost:3000`.

When Supabase is not configured, the public marketplace uses sample listings. Authentication, account features, uploads, and messaging require a configured Supabase project and the migration above.

## Production deployment

Deploy the repository to a Node.js-compatible platform such as Vercel. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the production environment, deploy, then add the production site URL and `/auth/callback` URL to Supabase Auth's allowlist. Use the hosting platform's managed HTTPS certificate; do not place a Supabase service-role key in this app.

Before launch, verify the database migration is applied, Supabase email delivery is configured, the listing-images bucket and policies exist, and signup, password recovery, listing photo uploads, favorites, and realtime messaging work with separate student accounts.

## Checks

```bash
npm run lint
npm run build
```