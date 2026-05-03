import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { SettingsMenu } from "@/components/settings-menu";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
];

export async function SiteHeader() {
  let userEmail: string | null = null;

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
            Watch Tracker
          </Link>
          <p className="text-sm text-zinc-500">
            Search TMDB movies and TV shows, then track them in your list.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
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
                My List
              </Link>
            ) : null}
            <SettingsMenu />
            <AccountMenu userEmail={userEmail} />
          </nav>
        </div>
      </div>
    </header>
  );
}
