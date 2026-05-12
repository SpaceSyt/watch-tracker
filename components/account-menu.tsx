"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AccountMenuProps = {
  userEmail: string | null;
};

function getAvatarLabel() {
  return "A";
}

export function AccountMenu({ userEmail }: AccountMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoggedIn = Boolean(userEmail);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected logout error.";

      window.alert(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open account menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-semibold text-zinc-800">
          {getAvatarLabel()}
        </span>
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm shadow-lg"
          role="menu"
          aria-label="Account menu"
        >
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Account
            </p>
            <p className="mt-1 truncate text-zinc-700">
              {userEmail ?? "Not logged in"}
            </p>
          </div>
          {isLoggedIn ? (
            <div className="grid py-1">
              <Link
                href="/account/profile"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                role="menuitem"
              >
                Profile
              </Link>
              <Link
                href="/account/settings"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                role="menuitem"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSubmitting}
                className="px-3 py-2 text-left text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
                role="menuitem"
              >
                {isSubmitting ? "Logging out..." : "Logout"}
              </button>
            </div>
          ) : (
            <div className="grid py-1">
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                role="menuitem"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                role="menuitem"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
