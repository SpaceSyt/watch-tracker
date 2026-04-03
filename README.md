# Watch Tracker

A web app for tracking movies, TV shows, and anime.

Current stage: early MVP foundation.

## Current Status

This project currently includes:

- Next.js App Router setup
- TypeScript + Tailwind CSS
- Supabase Auth (email/password)
- Login / signup / logout
- Protected `/my` page
- SSR-friendly session handling
- Basic page skeleton for future development

Not implemented yet:

- title search
- database business models
- watch entries
- ratings / reviews
- tags / custom lists
- episode tracking

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Prisma
- PostgreSQL (via Supabase, later business usage)

## Setup

```bash
git clone <your-repo-url>
cd watch-tracker
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Run:

```bash
npm run dev
```

Open http://localhost:3000
