# Project Stage
- Current stage: early scaffold and auth stabilization only.
- Treat the app as a small App Router project, not a mature product.
- Do not assume missing modules, helpers, or architecture already exist.

# Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth with `@supabase/ssr`
- Prisma is installed but not part of current feature work
- Package manager: npm
- Runtime environment: Windows-first local development

# Constraints
- Keep `app/` at the project root; do not migrate to `src/`.
- Do not introduce new UI libraries unless explicitly requested.
- Do not add OAuth, profile features, search logic, or product business logic unless explicitly requested.
- Do not modify Prisma schema unless explicitly requested.
- Do not add API routes unless explicitly required by the task.
- Prefer minimal SSR-safe auth changes over broad auth refactors.
- Keep components small, direct, and easy to trace.
- Avoid duplicate environment variable logic; use shared helpers.
- Use neutral, simple UI and avoid over-designed layouts.
- Do not add broad state management for local page concerns.
- Keep file naming explicit and conventional.

# Current Focus
- Preserve working email/password signup, login, logout, and `/my` protection.
- Preserve Supabase SSR session stability through the current proxy-based setup.
- Favor bug fixes, compatibility fixes, and small structural cleanup over new features.
- Keep `.env.local.example` placeholder-only and free of secrets.
