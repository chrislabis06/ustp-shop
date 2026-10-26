# Tatak Swap

A student marketplace for USTP built with Next.js, Supabase Auth, PostgreSQL, Storage, and Realtime.

## Local setup

1. Install dependencies with `npm install`.
2. Create a Supabase project and copy its project URL and anon/publishable key into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

3. Apply [`supabase/migrations/20261026000000_marketplace.sql`](supabase/migrations/20261026000000_marketplace.sql) in the Supabase SQL Editor. It creates the profile, listing, favorite, conversation, and message tables; row-level security policies; the `listing-images` bucket; and the message Realtime publication.
4. In Supabase Auth URL Configuration, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect URL allowlist. Add the production equivalents after deployment.
5. Configure an email provider in Supabase Auth before inviting real users. For production, configure SMTP and verify the sender domain; the signup and recovery flows use confirmation links handled by `/auth/callback`.
6. Start the app with `npm run dev` and open `http://localhost:3000`.

When Supabase is not configured, the public marketplace uses sample listings. Authentication, account features, uploads, and messaging require a configured Supabase project and the migration above.

## Production deployment

Deploy the repository to a Node.js-compatible platform such as Vercel. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the production environment, deploy, then add the production site URL and `/auth/callback` URL to Supabase Auth's allowlist. Use the hosting platform's managed HTTPS certificate; do not place a Supabase service-role key in this app.

Before launch, verify the database migration is applied, Supabase email delivery is configured, the listing-images bucket and policies exist, and signup, password recovery, listing photo uploads, favorites, and realtime messaging work with separate student accounts.

## Checks

```bash
npm run lint
npm run build
```