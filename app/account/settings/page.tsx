import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function AccountSettingsPage() {
  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow="Account"
        title="Settings"
        description="Supabase environment variables are not configured yet."
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
      eyebrow="Account"
      title="Settings"
      description="Account settings are a placeholder for now. Theme and language preferences stay in the header and are stored in this browser."
    >
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
        <p className="font-medium text-zinc-900">Signed in as {user.email}</p>
        <p className="mt-2">
          Full account settings and profile editing are not implemented yet.
        </p>
      </div>
    </PageShell>
  );
}
