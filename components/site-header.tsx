"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useI18n } from "@/components/language-preference";
import { SettingsMenu } from "@/components/settings-menu";

const AccountMenu = dynamic(
  () =>
    import("@/components/account-menu").then((module) => module.AccountMenu),
  {
    ssr: false,
    loading: () => (
      <span
        aria-hidden="true"
        className="h-10 w-10 rounded-full border border-zinc-200 bg-white"
      />
    ),
  },
);

export function SiteHeader() {
  const dictionary = useI18n();
  const navItems = [
    { href: "/", label: dictionary.common.home },
    { href: "/search", label: dictionary.common.search },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            {dictionary.common.appName}
          </Link>
          <p className="text-sm text-zinc-500">
            {dictionary.header.tagline}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <nav
            aria-label={dictionary.header.primaryNav}
            className="flex flex-wrap items-center gap-2"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/my"
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {dictionary.common.myList}
            </Link>
            <SettingsMenu />
            <AccountMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
