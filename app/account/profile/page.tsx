import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getServerDictionary } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function getDisplayName(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function AccountProfilePage() {
  const dictionary = await getServerDictionary();

  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow={dictionary.accountPage.eyebrow}
        title={dictionary.accountPage.profileTitle}
        description={dictionary.accountPage.noSupabase}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const displayName = getDisplayName(
    user.user_metadata.display_name,
    dictionary.accountPage.notSet,
  );
  const avatarLabel = user.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <PageShell
      eyebrow={dictionary.accountPage.eyebrow}
      title={dictionary.accountPage.profileTitle}
      description={dictionary.accountPage.profileDescription}
    >
      <div className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-semibold text-white">
            {avatarLabel}
          </div>
          <div>
            <p className="font-medium text-zinc-950">
              {dictionary.accountPage.avatarPlaceholder}
            </p>
            <p className="text-zinc-500">{dictionary.accountPage.noAvatar}</p>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-zinc-900">
              {dictionary.accountPage.email}
            </dt>
            <dd>{user.email ?? dictionary.common.notAvailable}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">
              {dictionary.accountPage.displayName}
            </dt>
            <dd>{displayName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-zinc-900">
              {dictionary.accountPage.userId}
            </dt>
            <dd className="break-all font-mono text-xs">{user.id}</dd>
          </div>
        </dl>
      </div>
    </PageShell>
  );
}
