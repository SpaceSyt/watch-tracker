"use client";

import Link from "next/link";
import { useI18n } from "@/components/language-preference";

export function EmptyCollection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const dictionary = useI18n();

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
        {description}
      </p>
      <Link
        href="/search"
        className="mt-5 inline-flex rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
      >
        {dictionary.collectionContent.searchTitles}
      </Link>
    </div>
  );
}
