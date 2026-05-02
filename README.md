# Watch Tracker

A web app for searching TMDB movies and TV shows, then tracking them in a personal watch list.

Current stage: early MVP with real search, title detail, auth, and list flows.

---

## Current Status

This project currently includes:

* Next.js App Router setup
* TypeScript + Tailwind CSS
* Supabase Auth (email/password)
* Login / signup flows with in-app logout action
* SSR-friendly session handling
* TMDB-backed title search at `/search`
* Title detail pages at `/title/tmdb/movie/[externalId]` and `/title/tmdb/tv/[externalId]`
* Add-to-list actions from title detail pages and saved list entries
* Protected `/my` page that groups saved titles by watch status
* Prisma models for user profiles, titles, and user title entries

Not implemented yet:

* Ratings / reviews
* Tags / custom lists
* Episode progress tracking UI
* Editing list entries beyond changing the saved watch status
* Anime-specific search or title support

---

## App Flows

### Search

Use `/search` to search TMDB for movies and TV shows. Search results show a poster when available, title, media type, release year, and overview. Selecting a result opens that title's detail page.

Search requires either `TMDB_ACCESS_TOKEN` or `TMDB_API_KEY` in `.env.local`.

### Title Details

Title detail pages are served from `/title/tmdb/movie/[externalId]` and `/title/tmdb/tv/[externalId]`. They load details from TMDB, show title metadata, poster art, overview, release information, and add-to-list buttons.

Signed-in users can save a title as:

* Want to Watch
* Watching
* Completed

If a user is not signed in, the add-to-list action returns an inline login prompt instead of saving.

### My List

Use `/my` to view saved titles. The page requires Supabase auth when Supabase environment variables are configured, then groups entries into Plan to Watch, Watching, and Completed sections sorted by recent updates.

If the list is empty, `/my` links back to `/search` so users can add their first title.

---

## Tech Stack

* Next.js
* TypeScript
* Tailwind CSS
* Supabase Auth
* Prisma
* PostgreSQL (via Supabase)
* TMDB API

---

## Requirements

Before running locally, install:

* Node.js 22+ or 24 LTS
* Git
* VS Code
* A Supabase account/project
* A TMDB API key or access token

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
* `TMDB_ACCESS_TOKEN` - optional TMDB bearer token; used instead of `TMDB_API_KEY` when present

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

## Validation

Run the project checks before handing off changes:

```bash
npm run validate
```

For read-only validation without generated-file writes, run:

```bash
npm run lint
npx tsc --noEmit --incremental false
```

`npm run validate` runs ESLint and the project typecheck script. The typecheck script generates the Prisma client first, so full validation can update generated Prisma client files.

---

## Notes

* Prisma 7 uses `prisma.config.ts` for database config
* Use Session pooler if direct connection fails
* Search and title detail pages call TMDB at request time and surface TMDB configuration or request errors in the UI

---

## Roadmap (Next Steps)

* Ratings / reviews
* Tags / custom lists
* Episode progress tracking UI
* Editing entries beyond selecting a watch status
