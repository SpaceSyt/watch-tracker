# Watch Tracker

A web app for searching TMDB movies and TV shows, then tracking them in a personal watch list.

Current stage: early MVP with search, title details, authentication, saved
collections, custom lists, ratings, reviews, and TV episode progress.

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
* Per-user 1-10 ratings and short reviews for saved title entries
* TV episode progress for Watching and Completed entries
* User-created custom lists with per-title assignment
* Batch copy, move, and removal actions for custom lists
* Prisma models and migrations for profiles, titles, entries, and custom lists

Not implemented yet:

* Tags
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

Each saved entry can also store your private 1-10 rating and a short review. Rating and review edits are available from the saved entry card on `/my`.

TV entries in Watching or Completed can store episode progress. The title
detail page provides the editor, while `/my` shows a compact progress summary.

You can also create custom lists, assign saved titles to one or more lists, and
use batch actions to copy, move, or remove selected titles.

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
* A Supabase account/project
* A TMDB API key or access token

Optional but recommended:

* VS Code
* Prisma extension for VS Code
* ESLint extension for VS Code

---

## Local Setup

Clone the repository:

```bash
git clone https://github.com/SpaceSyt/watch-tracker
cd watch-tracker
```

Create your local environment file:

macOS/Linux:

```bash
cp .env.local.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
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

Apply the existing migrations to a development database:

```bash
npx prisma migrate dev
```

Create a named migration only after intentionally changing
`prisma/schema.prisma`.

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

* Tags
* Additional entry editing beyond watch status, rating, and short review
* Anime-specific search, detail, save, and display flows

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, validation, and pull request
expectations.

## Security

Do not open a public issue for a suspected vulnerability or exposed secret.
Follow [SECURITY.md](SECURITY.md) instead.

## License

This project is licensed under the [MIT License](LICENSE).
