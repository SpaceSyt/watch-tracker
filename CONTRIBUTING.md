# Contributing

## Local setup

1. Install Node.js 22 or 24 LTS.
2. Run `npm ci`.
3. Copy `.env.local.example` to `.env.local`.
4. Add local/test Supabase, PostgreSQL, and TMDB credentials.
5. Run `npx prisma migrate dev` against a development database.
6. Start the app with `npm run dev`.

Never commit `.env`, `.env.local`, database dumps, access tokens, or private
keys. Keep `.env.local.example` limited to non-working placeholders.

## Changes

Keep changes focused and follow the existing Next.js App Router patterns. Do
not add dependencies or alter the Prisma schema unless the change requires it.
When changing user-facing behavior, update the README or smoke-test checklist
as appropriate.

## Validation

Before opening a pull request, run:

```bash
npm run validate
npm run build
```

For behavior that depends on Supabase, PostgreSQL, or TMDB, also run the
relevant steps in `docs/smoke-test.md` using test credentials and test data.

## Pull requests

Describe the user-visible result, implementation constraints, and validation
performed. Keep unrelated refactors out of the same pull request.
