import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getServerDictionary } from "@/lib/i18n-server";

export default async function Home() {
  const dictionary = await getServerDictionary();

  return (
    <PageShell
      eyebrow={dictionary.common.appName}
      title={dictionary.home.title}
      description={dictionary.home.description}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">
            {dictionary.home.searchTmdb}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {dictionary.home.searchTmdbDescription}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">
            {dictionary.home.saveTitles}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {dictionary.home.saveTitlesDescription}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-base font-semibold text-zinc-900">
            {dictionary.home.organizeList}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {dictionary.home.organizeListDescription}
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/search"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          {dictionary.home.searchTitles}
        </Link>
        <Link
          href="/my"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          {dictionary.home.viewMyList}
        </Link>
      </div>
    </PageShell>
  );
}
