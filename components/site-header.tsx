import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
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
            A simple starter shell for tracking movies, series, and anime.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {userEmail ? (
            <p className="text-sm text-zinc-500">Signed in as {userEmail}</p>
          ) : (
            <p className="text-sm text-zinc-500">Not logged in</p>
          )}
          <nav aria-label="Primary" className="flex flex-wrap gap-2">
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
              <>
                <Link
                  href="/my"
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  My List
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
