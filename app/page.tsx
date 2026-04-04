import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function Home() {
  return (
    <PageShell
      eyebrow="Day 1 Skeleton"
      title="Track what you watch without the clutter."
      description="This homepage is a placeholder product intro for a future watch tracker app. It currently exists to provide a clean landing page and a stable starting point for the rest of the project."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">Search titles</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Find movies, dramas, shows, and anime in a future search flow.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">Organize your list</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Keep a personal list of what you plan to watch, are watching, or finished.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">Add auth later</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Login and signup pages are scaffolded, but no real authentication is connected yet.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/search"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Go to Search
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
