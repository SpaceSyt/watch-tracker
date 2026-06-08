import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { SettingsMenu } from "@/components/settings-menu";
import { getLanguagePreference, getServerDictionary } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function SiteHeader() {
  const language = await getLanguagePreference();
  const dictionary = await getServerDictionary();
  let userEmail: string | null = null;
  const navItems = [
    { href: "/", label: dictionary.common.home },
    { href: "/search", label: dictionary.common.search },
  ];

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userEmail = user?.email ?? null;
  }

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
            {userEmail ? (
              <Link
                href="/my"
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                {dictionary.common.myList}
              </Link>
            ) : null}
            <SettingsMenu initialLanguage={language} />
            <AccountMenu userEmail={userEmail} initialLanguage={language} />
          </nav>
        </div>
      </div>
    </header>
  );
}
