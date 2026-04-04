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
* Basic page skeleton for future development

Not implemented yet:

* Title search
* Ratings / reviews
* Tags / custom lists
* Episode tracking

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

Install dependencies:

```bash
npm install
```

---

## Environment Variables

### `.env.local`

Used for client-side Supabase variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### `.env`

Used for Prisma database connection:

```env
DATABASE_URL=
```

---

## Database Setup

1. Create a Supabase project
2. Go to **Connect → Session pooler**
3. Copy the connection string (URI)

Then run:

```bash
npx prisma migrate dev --name init_mvp_schema
npx prisma generate
```

---

## Run the App

```bash
npm run dev
```

Open:

http://localhost:3000

---

## Notes

* Do NOT put `DATABASE_URL` in `.env.local`
* Prisma 7 uses `prisma.config.ts` for database config
* Use Session pooler if direct connection fails

---

## Roadmap (Next Steps)

* TMDB search integration
* Title detail page
* Add to list from real data
* My list UI with real entries
* Editing entries (status, rating, progress)
