# Madarth Actor Profile Submission

Public actor registration form plus a private talent database for the Madarth casting team.

- **Public form** (`/`): basic details, Instagram, photos (headshot required; up to 4 best pictures; 1 full-length), acting experience, languages, height, availability, travel and a consent checkbox. Under-18s must add parent/guardian details and consent. Each submission gets an Actor ID like `MAD-26-00042`.
- **Admin** (`/admin`): Google sign-in. Search by name, actor ID, phone, email or Instagram; filter by age range, gender, city, languages, status and submission date. Profile pages have a photo lightbox, contact links (call / WhatsApp / email), status (New / Shortlisted / Contacted / Selected / Not suitable) with history, and internal notes.
- **Team** (`/admin/team`): super admins add or remove casting-team members.

Stack: Next.js 16 (App Router, Cache Components), Astryx UI with a custom Madarth theme, Anek Tamil, Neon Postgres via Drizzle, private Vercel Blob for photos, Auth.js (Google).

## Roles

| Role | Who | Can |
| --- | --- | --- |
| Super admin | Emails in `SUPER_ADMIN_EMAILS` | Everything, including team management |
| Member | Emails added on `/admin/team` | Search, view, change status, notes |

Access is re-checked against the env var and the database on every admin request, so removing a member takes effect immediately.

## Setup

1. Install: `npm install`
2. Link to Vercel: `vercel link`
3. Database: add Neon from the Vercel Marketplace (`vercel integration add neon`) or paste an existing Neon `DATABASE_URL`.
4. Photos: create a **private** Blob store in the Vercel dashboard (Storage → Blob → Private) and connect it to the project. Either credential style works: `BLOB_READ_WRITE_TOKEN` (client-token uploads) or OIDC with `BLOB_STORE_ID` (presigned uploads). The registration page is static, so the mode is picked at build time: redeploy after connecting or changing the store.
5. Google OAuth: in Google Cloud Console create an OAuth client (Web application). Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google`
6. Env vars (see `.env.example`): add `AUTH_SECRET` (`npx auth secret`), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and `SUPER_ADMIN_EMAILS` in Vercel, then `vercel env pull .env.local`.
7. Create tables: `npm run db:migrate`
8. Run: `npm run dev`

Recommended: add a Vercel Firewall rate-limit rule on `/api/upload` and `/` POSTs. The app also has a simple per-IP limiter and a honeypot field.

## Scripts

| Script | What |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Validation unit tests (Vitest) |
| `npm run db:generate` | Generate a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse data in Drizzle Studio |
| `npm run theme:build` | Rebuild the Astryx theme after editing `src/themes/madarth/madarthTheme.ts` (and after upgrading Astryx) |

## Layout

```
src/
  app/(public)/          registration form, server action, success page
  app/admin/             dashboard, actor profile, team, admin actions
  app/api/upload/        Blob client-upload token (draft-folder scoped, type/size limited)
  app/api/photos/[id]/   streams private photos to signed-in admins only
  components/            form, admin and site components
  db/                    Drizzle schema + client
  lib/                   validation (shared client/server), authz, queries, rate limit
  themes/madarth/        Astryx theme source + built CSS/JS
drizzle/                 SQL migrations
```
