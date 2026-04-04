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

<<<<<<< HEAD
=======
---

>>>>>>> 9099b64 (database setup)
## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Prisma
- PostgreSQL (via Supabase, later business usage)

<<<<<<< HEAD
## Setup
=======
---

## Requirements

Before running locally, install:

- Node.js 22+ or 24 LTS
- Git
- VS Code
- A Supabase account/project

Optional but recommended:

- GitHub account
- Codex / AI coding assistant
- Prisma extension for VS Code
- ESLint extension for VS Code

---

## Local Setup

Clone the repository:
>>>>>>> 9099b64 (database setup)

```bash
git clone <your-repo-url>
cd watch-tracker
<<<<<<< HEAD
npm install
```

Create `.env.local`:

```
=======
```

Install dependencies:

```bash
npm install
```

Create environment files:

Copy .env.local.example to .env.local
Create a separate .env file for Prisma

If you are on Windows PowerShell and cp does not work, create the files manually.

.env.local

Used for public client-side Supabase variables:

```bash
>>>>>>> 9099b64 (database setup)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

<<<<<<< HEAD
Run:
=======
.env

Used for Prisma database connection:

```bash
DATABASE_URL=
```

Supabase setup notes
NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY come from your Supabase project settings
DATABASE_URL should use the Supabase Postgres connection string
For local Prisma migration in this project, use the Session pooler connection string instead of direct connection if direct connection is unreachable

Run database migration:

```bash
npx prisma migrate dev --name init_mvp_schema
npx prisma generate
```

Then start the app:
>>>>>>> 9099b64 (database setup)

```bash
npm run dev
```

<<<<<<< HEAD
Open http://localhost:3000
=======
Open:

```bash
http://localhost:3000
```
>>>>>>> 9099b64 (database setup)
