# Manual Smoke Test Checklist

Use this checklist before merging feature work or before a deployment rehearsal. It intentionally covers the current MVP only: email/password auth, protected `/my`, TMDB movie/TV search, title detail, saved-entry lifecycle, rating/review gating, TV episode progress, remove from `/my`, global preference menus, account/avatar menu behavior, and compact `/my` summaries.

Do not use this checklist to claim anime support. Anime is not implemented unless search, detail, save, and display flows explicitly support it.

## Preconditions

- `.env.local` is configured from `.env.local.example` with real local/test values:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the documented anon-key fallback
  - `DATABASE_URL`
  - `TMDB_API_KEY` or the currently supported TMDB token/key variable
- The database has the current Prisma migrations applied for the target environment.
- The app can run locally with `npm run dev`.
- Use a test account and test data that can be safely removed.

## 1. Environment and startup

- [ ] Start the app with `npm run dev`.
- [ ] Open `/` and confirm the page loads without missing-env errors.
- [ ] Open `/search` and confirm the page loads.
- [ ] Open `/my` while signed out and confirm it redirects to `/auth/login`.

## 2. Auth

- [ ] Go to `/auth/signup` and create a new email/password test user.
- [ ] Confirm successful signup lands on `/my` or a signed-in state.
- [ ] Confirm the header shows signed-in navigation, including My List and logout.
- [ ] Log out.
- [ ] Confirm the header returns to signed-out navigation.
- [ ] Go to `/auth/login` and sign back in with the same test user.
- [ ] Reload the page and confirm the session remains signed in.
- [ ] Visit `/my` while signed in and confirm it does not redirect to login.
- [ ] Use the account/avatar menu logout action and confirm it signs the user out.

## 3. `/my` protection

- [ ] In a signed-out browser/session, visit `/my` directly.
- [ ] Confirm unauthenticated users are redirected to `/auth/login`.
- [ ] In a signed-in browser/session, visit `/my` directly.
- [ ] Confirm the page shows the signed-in user's list state and does not expose another user's entries.

## 4. TMDB search

- [ ] Go to `/search`.
- [ ] Search for a known movie.
- [ ] Confirm movie results render with title metadata and a link to title detail.
- [ ] Search for a known TV title.
- [ ] Confirm TV results render with title metadata and a link to title detail.
- [ ] Submit an empty or whitespace search and confirm the app does not crash.
- [ ] Confirm search results are limited to currently supported movie/TV behavior; do not treat anime as implemented.

## 5. Title detail

- [ ] Open a movie title detail page from search.
- [ ] Confirm title, year/date, description, media type, source/id, and poster/no-poster state render safely.
- [ ] Open a TV title detail page from search.
- [ ] Confirm total episodes displays when TMDB provides it, or `N/A`/safe fallback when it does not.
- [ ] Confirm unsupported source/media URLs do not render as supported title pages.
- [ ] Confirm title detail shows add/status controls for signed-in users.

## 6. Add and update saved entry

Using a signed-in test user:

- [ ] Open a title detail page for a movie or TV title.
- [ ] Click `Want to Watch`.
- [ ] Confirm success feedback appears.
- [ ] Open `/my` and confirm the title appears in the Plan to Watch group.
- [ ] Return to the title detail page and change the status to `Watching`.
- [ ] Confirm `/my` moves the title to the Watching group and group counts update.
- [ ] Return to the title detail page and change the status to `Completed`.
- [ ] Confirm `/my` moves the title to the Completed group and group counts update.
- [ ] Confirm repeated status updates do not create duplicate entries for the same title.

## 7. Rating/review gating

- [ ] Save a title as `Want to Watch` / `PLAN_TO_WATCH`.
- [ ] Confirm rating and review editing controls are not shown for that Plan to Watch entry.
- [ ] Confirm the app blocks Plan to Watch rating/review editing and any visible helper text explains that ratings/reviews are available after moving to Watching or Completed.
- [ ] Move the same title to `Watching`.
- [ ] Confirm rating and review controls appear on the title detail page.
- [ ] Save a valid rating from 1 to 10 and a short review.
- [ ] Confirm success feedback appears.
- [ ] Reload the title detail page and confirm the saved rating/review remain visible in the edit form.
- [ ] Edit the rating/review again and confirm the update persists.
- [ ] Move or save a title as `Completed` and confirm rating/review editing is also available there.
- [ ] Confirm `/my` only shows compact rating/review summaries and does not become the full rating/review editor.

## 8. TV episode progress

Using a signed-in test user and a TV title:

- [ ] Save a TV title as `Want to Watch`.
- [ ] Confirm episode progress editing is not shown for the Plan to Watch entry.
- [ ] Move the TV title to `Watching`.
- [ ] Confirm the title detail page shows the episode progress editor.
- [ ] Enter a valid whole-number progress value and save it.
- [ ] Confirm success feedback appears and the saved value remains after reloading the title detail page.
- [ ] Open `/my` and confirm the Watching group shows a compact progress summary, such as `Progress: 3 / 10 episodes` when TMDB provides a known total.
- [ ] If the TV title has an unknown total episode count, confirm `/my` still shows a safe progress summary or omits the denominator without crashing.
- [ ] Clear the progress value and confirm the title detail page and `/my` summary update safely.
- [ ] Move or save the TV title as `Completed` and confirm episode progress editing remains available there.
- [ ] Open a movie title detail page and confirm movie entries do not show episode progress editing.

## 9. Compact `/my` behavior

- [ ] Confirm `/my` groups entries under Plan to Watch, Watching, and Completed.
- [ ] Confirm each group shows a count.
- [ ] Confirm entries are compact cards/summaries with title, media/year, updated date, description summary, and rating/review summary when available.
- [ ] Confirm TV entries in Watching or Completed show a compact episode progress summary when progress data is available.
- [ ] Confirm long descriptions and reviews are visually truncated or summarized rather than expanding the list excessively.
- [ ] Confirm Plan to Watch entries do not show an editable rating/review form on `/my`.
- [ ] Confirm `/my` provides a clear path to add another title through search.

## 10. Remove saved title

- [ ] On `/my`, open the saved title overflow/actions menu.
- [ ] Choose `Remove from my list` and confirm removal.
- [ ] Confirm the title disappears from `/my`.
- [ ] Reopen the removed title detail page.
- [ ] Confirm the title detail page reflects the unsaved state.
- [ ] Add the title again and confirm it appears once in `/my`.

## 11. Theme preference

- [ ] Locate the theme preference button in the header.
- [ ] Click it until the Light preference is selected and confirm the page uses the light theme state.
- [ ] Click it until the Dark preference is selected and confirm the page uses the dark theme state.
- [ ] Click it until the System preference is selected and confirm the page follows the current OS/browser color-scheme preference.
- [ ] Reload the page and confirm the selected preference persists.
- [ ] Confirm theme changes do not sign the user out or change saved-title data.

## 12. Language preference menu

- [ ] Open the language preference menu in the header.
- [ ] Confirm the menu labels itself as a preference-only control, not complete translation support.
- [ ] Select `EN-US` and confirm the menu closes and the selected state updates.
- [ ] Reopen the menu, select `ZH-CN`, and confirm the menu closes and the selected state updates.
- [ ] Reload the page and confirm the selected language preference persists.
- [ ] Reopen the menu and press Escape or click outside; confirm the menu closes without changing saved-title data.

## 13. Account/avatar menu

- [ ] While signed out, open the avatar/account menu.
- [ ] Confirm it shows signed-out account state and links to `Login` and `Sign Up`.
- [ ] Choose `Login` or `Sign Up` and confirm the menu closes and navigation works.
- [ ] While signed in, open the avatar/account menu.
- [ ] Confirm the avatar uses the signed-in email initial and the menu shows the signed-in email.
- [ ] Confirm `Profile` and `Settings` links are present and navigate to their pages without signing the user out.
- [ ] Confirm the `Logout` menu item signs the user out, returns to signed-out navigation, and protects `/my`.
- [ ] Reopen the menu and press Escape or click outside; confirm the menu closes without navigation.

## 14. Validation commands

Run these after the manual flow when preparing a branch for merge or deployment:

- [ ] `npm run validate`
- [ ] `npm run build`

Record any failures with the command output, browser route, signed-in state, and the exact step that failed.

## Pass criteria

The smoke test passes when:

- Auth signup, login, logout, session reload, and `/my` protection work.
- TMDB movie and TV search/detail flows work.
- Saved entries can be added, moved between statuses, and removed.
- Plan to Watch entries cannot edit rating/review.
- Watching and Completed entries can edit rating/review from title detail.
- TV episode progress can be edited from title detail for Watching and Completed TV entries, and `/my` shows compact progress summaries.
- `/my` remains compact and summary-focused.
- Light, Dark, and System theme preferences work and persist.
- The language preference menu works as a preference-only menu.
- Account/avatar menu signed-in and signed-out behavior works.
- `npm run validate` passes.
- `npm run build` passes for release/deployment readiness.
