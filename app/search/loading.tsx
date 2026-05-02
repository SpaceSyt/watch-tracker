import { PageShell } from "@/components/page-shell";

export default function SearchLoading() {
  return (
    <PageShell
      eyebrow="Explore"
      title="Search"
      description="Loading search results."
    >
      <div className="space-y-4">
        <div className="h-11 max-w-2xl rounded-md bg-zinc-100" />
        <div className="grid gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[92px_1fr]"
            >
              <div className="h-32 w-[92px] rounded-md bg-zinc-200" />
              <div className="space-y-3">
                <div className="h-5 w-2/3 rounded bg-zinc-200" />
                <div className="h-4 w-1/3 rounded bg-zinc-100" />
                <div className="h-4 w-full rounded bg-zinc-100" />
                <div className="h-4 w-5/6 rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
