import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function getDisplayName(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "Not set";
}

export default async function AccountProfilePage() {
  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow="Account"
        title="Profile"
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

  const displayName = getDisplayName(user.user_metadata.display_name);
  const avatarLabel = user.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <PageShell
      eyebrow="Account"
      title="Profile"
      description="A minimal read-only account profile placeholder. Full profile editing is not implemented yet."
    >
      <div className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-semibold text-white">
            {avatarLabel}
          </div>
          <div>
            <p className="font-medium text-zinc-950">Avatar placeholder</p>
            <p className="text-zinc-500">No avatar upload is available yet.</p>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-zinc-900">Email</dt>
            <dd>{user.email ?? "Not available"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Display name</dt>
            <dd>{displayName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-zinc-900">User ID</dt>
            <dd className="break-all font-mono text-xs">{user.id}</dd>
          </div>
        </dl>
      </div>
    </PageShell>
  );
}
