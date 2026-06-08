import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getServerDictionary } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function AccountSettingsPage() {
  const dictionary = await getServerDictionary();

  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow={dictionary.accountPage.eyebrow}
        title={dictionary.accountPage.settingsTitle}
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

  return (
    <PageShell
      eyebrow={dictionary.accountPage.eyebrow}
      title={dictionary.accountPage.settingsTitle}
      description={dictionary.accountPage.settingsDescription}
    >
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
        <p className="font-medium text-zinc-900">
          {dictionary.accountPage.signedInAs(user.email ?? "")}
        </p>
        <p className="mt-2">
          {dictionary.accountPage.fullSettingsPending}
        </p>
      </div>
    </PageShell>
  );
}
