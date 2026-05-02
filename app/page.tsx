import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function Home() {
  return (
    <PageShell
      eyebrow="Watch Tracker"
      title="Track what you watch without the clutter."
      description="Search TMDB for movies and TV shows, open title details, and save titles to your protected list grouped by watch status."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">Search TMDB</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Find movies and TV shows, then open a result to view its title details.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">Save titles</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Add titles as Want to Watch, Watching, or Completed from their detail pages.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">View My List</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Sign in with email and password to see saved titles grouped by status.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/search"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Search Titles
        </Link>
        <Link
          href="/my"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          View My List
        </Link>
      </div>
    </PageShell>
  );
}
