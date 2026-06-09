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
    { href: "/my", label: dictionary.common.myList },
  ];

  const navLinks = navItems.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
    >
      {item.label}
    </Link>
  ));

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
              {dictionary.common.appName}
            </Link>
            <p className="text-sm text-zinc-500">
              {dictionary.header.tagline}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <nav
              aria-label={dictionary.header.primaryNav}
              className="hidden items-center gap-2 md:flex"
            >
              {navLinks}
            </nav>
            <SettingsMenu />
            <AccountMenu />
          </div>
        </div>
        <nav
          aria-label={dictionary.header.primaryNav}
          className="mt-3 flex flex-wrap items-center gap-2 md:hidden"
        >
          {navLinks}
        </nav>
      </div>
    </header>
  );
}
