# Watch Tracker

A web app for tracking movies, TV shows, and anime.

Current stage: early MVP foundation.

---

## Current Status

This project currently includes:

* Next.js App Router setup
* TypeScript + Tailwind CSS
* Supabase Auth (email/password)
* Login / signup / logout
* Protected `/my` page
* SSR-friendly session handling
* TMDB-powered `/search` route for movie and TV discovery
* Dynamic title pages at `/title/[source]/[mediaType]/[externalId]` with details
* Shared list workflow: save titles from search/detail into `/my`
* `add-title` server action with session validation and per-user persistence

Not implemented yet:

* Ratings / reviews
* Tags / custom lists
* Episode tracking
* Profile preferences and social features

---

## Tech Stack

* Next.js
* TypeScript
* Tailwind CSS
* Supabase Auth
* Prisma
* PostgreSQL (via Supabase)

---

## Requirements

Before running locally, install:

* Node.js 22+ or 24 LTS
* Git
* VS Code
* A Supabase account/project

Optional but recommended:

* GitHub account
* Prisma extension for VS Code
* ESLint extension for VS Code

---

## Local Setup

Clone the repository:

```bash
git clone <your-repo-url>
cd watch-tracker
```

Create your local environment file:

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with:

* `NEXT_PUBLIC_SUPABASE_URL` - your Supabase Project URL
* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - your Supabase Publishable Key
* `NEXT_PUBLIC_SUPABASE_ANON_KEY` - optional fallback for older setups
* `DATABASE_URL` - your Supabase PostgreSQL connection string
* `TMDB_API_KEY` - your TMDB API key

Install dependencies, generate the Prisma client, and start the dev server:

```bash
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000.

Prisma client must be generated locally after environment setup. If you skip `npx prisma generate`, database-related pages may fail at runtime.

---

## Database Setup

1. Create a Supabase project
2. Go to **Connect > Session pooler**
3. Copy the connection string (URI)
4. Use that connection string for `DATABASE_URL` in `.env.local`

Run migrations only when you need to create or update the local schema:

```bash
npx prisma migrate dev --name init_mvp_schema
```

---

## Notes

* Prisma 7 uses `prisma.config.ts` for database config
* Use Session pooler if direct connection fails

---

## Roadmap (Next Steps)

* Improve list editing flow (change status, delete, notes)
* Add ratings, progress, and richer metadata on list entries
